"use server";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { surplusListings, surplusReservations, products } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { measureApiCall } from "@/app/lib/ai-instrumentation";

export async function getSurplusListings() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const rows = await db
    .select({
      id: surplusListings.id,
      title: surplusListings.title,
      price: surplusListings.price,
      quantity: surplusListings.quantity,
      remainingQuantity: surplusListings.remainingQuantity,
      status: surplusListings.status,
      expiresAt: surplusListings.expiresAt,
      productId: surplusListings.productId,
      unitLabel: surplusListings.unitLabel,
    })
    .from(surplusListings)
    .where(eq(surplusListings.userId, session.user.id))
    .orderBy(desc(surplusListings.createdAt));

  return rows.map((row) => ({
    ...row,
    price: Number(row.price),
  }));
}

export async function getSurplusStats() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [listingStats] = await db
    .select({
      activeListings: sql<number>`sum(case when ${surplusListings.status} = 'active' then 1 else 0 end)`.mapWith(Number),
    })
    .from(surplusListings)
    .where(eq(surplusListings.userId, session.user.id));

  const rows = await db
    .select({
      id: surplusReservations.id,
      quantity: surplusReservations.quantity,
      status: surplusReservations.status,
      price: surplusListings.price,
    })
    .from(surplusReservations)
    .innerJoin(surplusListings, eq(surplusReservations.listingId, surplusListings.id))
    .where(eq(surplusListings.userId, session.user.id));

  let totalReserved = 0;
  let totalRevenue = 0;

  for (const row of rows) {
    if (row.status === 'pending') {
      totalReserved += row.quantity;
    }
    if (row.status === 'picked_up') {
      totalRevenue += Number(row.price) * row.quantity;
    }
  }

  return {
    activeListings: listingStats?.activeListings || 0,
    totalReserved,
    totalRevenue,
  };
}

export async function generateSurplusDescription(title: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return "Tersedia stok surplus dengan harga diskon. Hubungi untuk detail lebih lanjut.";
  }

  const prompt = `Kamu adalah copywriter untuk warung/UMKM. Buat 2 kalimat deskripsi menarik untuk produk surplus (stok berlebih yang dijual murah) dengan nama: "${title}". 
Fokus pada keuntungan pembeli (harga hemat, masih bagus) dengan bahasa Indonesia yang natural.`;

  try {
    const { text } = await measureApiCall(
      () =>
        generateText({
          model: google("gemini-2.5-flash"),
          prompt,
        }),
      "dashboard", // we can use 'dashboard' since it's an ad-hoc UI generation task
      session.user.id,
      "gemini-2.5-flash",
    );
    return text.trim();
  } catch (error) {
    console.error("AI Error:", error);
    return "Tersedia stok surplus dengan harga diskon. Dapatkan penawaran terbaik ini sebelum kehabisan.";
  }
}

export async function createSurplusListing(data: {
  title: string;
  description: string;
  price: number;
  quantity: number;
  expiresAt: string; // ISO date string
  productId?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  // If a product is linked, we must deduct stock to prevent double-selling
  if (data.productId) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, data.productId), eq(products.userId, session.user.id)));

    if (!product) {
      throw new Error("Linked product not found");
    }

    if (product.stock < data.quantity) {
      throw new Error("Not enough stock in the main product to create this surplus listing.");
    }

    await db
      .update(products)
      .set({ stock: product.stock - data.quantity, updatedAt: new Date() })
      .where(eq(products.id, data.productId));
  }

  const [listing] = await db
    .insert(surplusListings)
    .values({
      userId: session.user.id,
      title: data.title,
      description: data.description,
      price: data.price.toString(),
      quantity: data.quantity,
      remainingQuantity: data.quantity,
      expiresAt: new Date(data.expiresAt),
      productId: data.productId || null,
      status: "active",
    })
    .returning();

  revalidatePath("/dashboard/surplus");
  revalidatePath("/dashboard/products");
  return { success: true, id: listing.id };
}

export async function verifyPickupCode(code: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  
  const [reservation] = await db
    .select({
      id: surplusReservations.id,
      listingId: surplusReservations.listingId,
      status: surplusReservations.status,
      quantity: surplusReservations.quantity,
    })
    .from(surplusReservations)
    .where(eq(surplusReservations.confirmationCode, code));

  if (!reservation) {
    throw new Error("Kode tidak ditemukan.");
  }

  if (reservation.status !== "pending") {
    throw new Error("Reservasi ini sudah tidak aktif atau sudah diambil.");
  }

  // Mark reservation as complete
  await db
    .update(surplusReservations)
    .set({ status: "picked_up", pickupAt: new Date(), updatedAt: new Date() })
    .where(eq(surplusReservations.id, reservation.id));

  revalidatePath("/dashboard/surplus");
  return { success: true };
}
