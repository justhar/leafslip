"use server";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { products, receiptItems, receipts } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

type InsightAction = "restock" | "monitor" | "reduce" | "unknown";

const normalizeName = (value: string) => value.trim();

const buildStockRange = (avgDailyDemand: number) => {
  if (avgDailyDemand <= 0) {
    return { min: 0, max: 3 };
  }

  const min = Math.max(1, Math.ceil(avgDailyDemand * 7));
  const max = Math.max(min + 2, Math.ceil(avgDailyDemand * 14));
  return { min, max };
};

const buildAction = (params: {
  avgDailyDemand: number;
  stock: number;
  range: { min: number; max: number };
}): InsightAction => {
  if (params.avgDailyDemand <= 0) {
    return params.stock > 0 ? "reduce" : "monitor";
  }

  if (params.stock < params.range.min) {
    return "restock";
  }

  if (params.stock > params.range.max * 2) {
    return "reduce";
  }

  return "monitor";
};

const buildFallbackMessage = (params: {
  action: InsightAction;
  stockRange: string;
  totalPurchased: number;
  avgDailyDemand: number;
}) => {
  if (params.action === "restock") {
    return `Permintaan ${params.totalPurchased} unit dalam 30 hari terakhir. Disarankan siapkan stok ${params.stockRange} unit agar tidak kehabisan.`;
  }

  if (params.action === "reduce") {
    return `Permintaan rendah (${params.totalPurchased} unit/30 hari). Pertimbangkan turunkan stok ke ${params.stockRange} unit.`;
  }

  if (params.avgDailyDemand <= 0) {
    return `Belum ada pembelian 30 hari terakhir. Jaga stok rendah di kisaran ${params.stockRange} unit sambil dipantau.`;
  }

  return `Permintaan stabil (${params.totalPurchased} unit/30 hari). Jaga ketersediaan stok di kisaran ${params.stockRange} unit.`;
};

export async function getProducts() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.userId, session.user.id))
    .orderBy(desc(products.createdAt));

  return userProducts.map((product) => ({
    id: product.id.toString(),
    name: product.name,
    sellingPrice: Number(product.sellingPrice),
    stock: product.stock,
    productionCost: Number(product.productionCost),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));
}

export async function getProductInsights() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const userProducts = await db
    .select({
      id: products.id,
      name: products.name,
      stock: products.stock,
    })
    .from(products)
    .where(eq(products.userId, session.user.id))
    .orderBy(desc(products.createdAt));

  if (userProducts.length === 0) {
    return [] as Array<{
      productId: string;
      action: InsightAction;
      stockRange: string;
      message: string;
    }>;
  }

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30);
  const startDateString = startDate.toISOString().slice(0, 10);

  const rows = await db
    .select({
      name: receiptItems.name,
      quantity: receiptItems.quantity,
      date: receipts.date,
    })
    .from(receiptItems)
    .leftJoin(receipts, eq(receipts.id, receiptItems.receiptId))
    .where(
      and(
        eq(receipts.userId, session.user.id),
        gte(receipts.date, startDateString),
      ),
    );

  const purchaseMap = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeName(row.name);
    const qty = Number(row.quantity) || 0;
    purchaseMap.set(key, (purchaseMap.get(key) ?? 0) + qty);
  }

  const baseInsights = userProducts.map((product) => {
    const totalPurchased = purchaseMap.get(normalizeName(product.name)) ?? 0;
    const avgDailyDemand = totalPurchased / 30;
    const range = buildStockRange(avgDailyDemand);
    const action = buildAction({
      avgDailyDemand,
      stock: product.stock,
      range,
    });
    const stockRange = `${range.min}-${range.max}`;

    return {
      productId: product.id.toString(),
      name: product.name,
      stock: product.stock,
      totalPurchased,
      avgDailyDemand: Number(avgDailyDemand.toFixed(2)),
      action,
      stockRange,
    };
  });

  const fallback = baseInsights.map((item) => ({
    productId: item.productId,
    action: item.action,
    stockRange: item.stockRange,
    message: buildFallbackMessage({
      action: item.action,
      stockRange: item.stockRange,
      totalPurchased: item.totalPurchased,
      avgDailyDemand: item.avgDailyDemand,
    }),
  }));

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return fallback;
  }

  const schema = z.object({
    insights: z.array(
      z.object({
        productId: z.string(),
        message: z.string(),
      }),
    ),
  });

  const prompt = `You are a retail assistant. Create a short Indonesian insight for each product (max 1 sentence). Use the provided action and stockRange. Mention totalPurchased or avgDailyDemand when helpful. Do not add extra products.

Time window: 30 days.

Products:
${baseInsights
  .map(
    (item) =>
      `- productId: ${item.productId}, name: ${item.name}, stock: ${item.stock}, totalPurchased: ${item.totalPurchased}, avgDailyDemand: ${item.avgDailyDemand}, action: ${item.action}, stockRange: ${item.stockRange} unit`,
  )
  .join("\n")}

Return JSON: { insights: [{ productId, message }] }`;

  try {
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema,
      prompt,
    });

    const messageMap = new Map(
      result.object.insights.map((item) => [item.productId, item.message]),
    );

    return baseInsights.map((item, index) => ({
      productId: item.productId,
      action: item.action,
      stockRange: item.stockRange,
      message: messageMap.get(item.productId) ?? fallback[index].message,
    }));
  } catch (error) {
    return fallback;
  }
}

export async function createProduct(data: {
  name: string;
  sellingPrice: number;
  stock?: number;
  productionCost?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [newProduct] = await db
    .insert(products)
    .values({
      userId: session.user.id,
      name: data.name,
      sellingPrice: data.sellingPrice.toString(),
      stock: data.stock ?? 0,
      productionCost: (data.productionCost ?? 0).toString(),
    })
    .returning();

  revalidatePath("/dashboard/products");
  return { success: true, productId: newProduct.id };
}

export async function updateProduct(
  productId: number,
  data: {
    name?: string;
    sellingPrice?: number;
    stock?: number;
    productionCost?: number;
  },
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  // Verify ownership
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));

  if (!product || product.userId !== session.user.id) {
    throw new Error("Product not found or unauthorized");
  }

  // Build update object
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sellingPrice !== undefined)
    updateData.sellingPrice = data.sellingPrice.toString();
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.productionCost !== undefined)
    updateData.productionCost = data.productionCost.toString();

  await db.update(products).set(updateData).where(eq(products.id, productId));

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function deleteProduct(productId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  // Verify ownership
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));

  if (!product || product.userId !== session.user.id) {
    throw new Error("Product not found or unauthorized");
  }

  await db.delete(products).where(eq(products.id, productId));

  revalidatePath("/dashboard/products");
  return { success: true };
}
