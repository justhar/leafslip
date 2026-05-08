"use server";

import { getDb } from "@/db";
import { surplusListings, surplusReservations, users } from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getActiveListings() {
  const db = getDb();
  
  // Clean up expired listings first (optional, or just filter them out)
  const now = new Date();
  
  const rows = await db
    .select({
      id: surplusListings.id,
      title: surplusListings.title,
      description: surplusListings.description,
      price: surplusListings.price,
      quantity: surplusListings.quantity,
      remainingQuantity: surplusListings.remainingQuantity,
      expiresAt: surplusListings.expiresAt,
      merchantName: users.name,
      merchantId: users.id,
    })
    .from(surplusListings)
    .innerJoin(users, eq(surplusListings.userId, users.id))
    .where(
      and(
        eq(surplusListings.status, "active"),
        gt(surplusListings.remainingQuantity, 0),
        gt(surplusListings.expiresAt, now)
      )
    )
    .orderBy(desc(surplusListings.createdAt));

  return rows.map(r => ({
    ...r,
    price: Number(r.price)
  }));
}

export async function createReservation(data: {
  listingId: number;
  guestName: string;
  guestPhone: string;
  quantity: number;
  pickupTime: string;
}) {
  const db = getDb();

  // Validate listing
  const [listing] = await db
    .select()
    .from(surplusListings)
    .where(eq(surplusListings.id, data.listingId));

  if (!listing) {
    throw new Error("Listing tidak ditemukan");
  }

  if (listing.status !== "active" || listing.remainingQuantity < data.quantity) {
    throw new Error("Kuantitas tidak mencukupi atau listing sudah tidak aktif");
  }

  const code = generateCode();

  // Create reservation
  await db.insert(surplusReservations).values({
    listingId: data.listingId,
    guestName: data.guestName,
    guestPhone: data.guestPhone,
    quantity: data.quantity,
    confirmationCode: code,
    status: "pending",
    notes: data.pickupTime,
    expiresAt: new Date(listing.expiresAt.getTime() + 2 * 60 * 60 * 1000), // Listing expiry + 2 hours
  });

  // Update listing remaining quantity
  const newRemaining = listing.remainingQuantity - data.quantity;
  const newStatus = newRemaining <= 0 ? "reserved" : "active";

  await db
    .update(surplusListings)
    .set({
      remainingQuantity: newRemaining,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(surplusListings.id, listing.id));

  revalidatePath("/market");
  
  return { success: true, code };
}
