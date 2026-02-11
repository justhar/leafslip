"use server";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { receipts, receiptItems, products } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export async function getReceipts() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const rows = await db
    .select({
      receiptId: receipts.id,
      receiptDate: receipts.date,
      merchantName: receipts.merchantName,
      grandTotal: receipts.grandTotal,
      category: receipts.category,
      itemId: receiptItems.id,
      itemName: receiptItems.name,
      itemQuantity: receiptItems.quantity,
      itemUnitPrice: receiptItems.unitPrice,
      itemTotal: receiptItems.total,
    })
    .from(receipts)
    .leftJoin(receiptItems, eq(receiptItems.receiptId, receipts.id))
    .where(eq(receipts.userId, session.user.id))
    .orderBy(desc(receipts.date));

  const receiptMap = new Map<number, any>();

  for (const row of rows) {
    if (!receiptMap.has(row.receiptId)) {
      receiptMap.set(row.receiptId, {
        id: row.receiptId.toString(),
        date: row.receiptDate,
        merchantName: row.merchantName,
        items: [],
        grandTotal: Number(row.grandTotal),
        category: row.category || "Other",
      });
    }

    if (row.itemId) {
      receiptMap.get(row.receiptId).items.push({
        name: row.itemName,
        quantity: row.itemQuantity,
        unitPrice: Number(row.itemUnitPrice),
        total: Number(row.itemTotal),
      });
    }
  }

  return Array.from(receiptMap.values());
}

export async function getPurchaseSummary() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const rows = await db
    .select({
      name: receiptItems.name,
      quantity: sql<number>`cast(sum(${receiptItems.quantity}) as int)`.mapWith(
        Number,
      ),
    })
    .from(receiptItems)
    .leftJoin(receipts, eq(receipts.id, receiptItems.receiptId))
    .where(eq(receipts.userId, session.user.id))
    .groupBy(receiptItems.name);

  return rows.map((row) => ({
    name: row.name,
    quantity: Number(row.quantity ?? 0),
  }));
}

export async function createReceipt(data: {
  date: string;
  merchantName: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  grandTotal: number;
  category?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  // Insert receipt
  const [newReceipt] = await db
    .insert(receipts)
    .values({
      userId: session.user.id,
      date: data.date,
      merchantName: data.merchantName,
      grandTotal: data.grandTotal.toString(),
      category: data.category || "Other",
    })
    .returning();

  // Insert receipt items
  await db.insert(receiptItems).values(
    data.items.map((item) => ({
      receiptId: newReceipt.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
    })),
  );

  const normalizeName = (value: string) => value.trim();
  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.userId, session.user.id));

  const productMap = new Map(
    userProducts.map((product) => [normalizeName(product.name), product]),
  );

  const newProductNames = new Set<string>();

  for (const item of data.items) {
    const normalizedName = normalizeName(item.name);
    const existingProduct = productMap.get(normalizedName);
    const quantity = Number.isFinite(Number(item.quantity))
      ? Number(item.quantity)
      : 0;

    if (existingProduct) {
      const nextStock = existingProduct.stock - quantity;
      await db
        .update(products)
        .set({ stock: nextStock, updatedAt: new Date() })
        .where(eq(products.id, existingProduct.id));
      productMap.set(normalizedName, {
        ...existingProduct,
        stock: nextStock,
      });
      continue;
    }

    await db.insert(products).values({
      userId: session.user.id,
      name: item.name,
      sellingPrice: item.unitPrice.toString(),
      stock: 0 - quantity,
      productionCost: "0",
    });

    newProductNames.add(item.name);
  }

  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/products");
  return {
    success: true,
    receiptId: newReceipt.id,
    newProductNames: Array.from(newProductNames),
  };
}

export async function extractReceiptItems(imageDataUrl: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!imageDataUrl.startsWith("data:")) {
    throw new Error("Invalid image data");
  }

  const base64Payload = imageDataUrl.split(",")[1];
  if (!base64Payload) {
    throw new Error("Invalid image data");
  }

  const schema = z.object({
    items: z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.number().nonnegative(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
  });

  const result = await generateObject({
    model: google("gemini-2.5-flash"),
    schema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Ekstrak item dari gambar struk ini. Kembalikan JSON dengan items: [{ name, price, quantity }]. price adalah harga per item, quantity adalah angka bulat.",
          },
          {
            type: "image",
            image: Buffer.from(base64Payload, "base64"),
          },
        ],
      },
    ],
  });

  return result.object;
}

export async function deleteReceipt(receiptId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  // Verify ownership before deleting
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId));

  if (!receipt || receipt.userId !== session.user.id) {
    throw new Error("Receipt not found or unauthorized");
  }

  // Delete receipt (cascade will delete items)
  await db.delete(receipts).where(eq(receipts.id, receiptId));

  revalidatePath("/dashboard/history");
  return { success: true };
}
