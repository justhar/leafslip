"use server";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { products, receiptItems, receipts, aiInsights } from "@/db/schema";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { measureApiCall } from "@/app/lib/ai-instrumentation";

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

/**
 * Generate product insights with token tracking.
 * Estimated token cost: ~1000 tokens avg, DB cached but newly computed calls logged.
 */
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
      eligibleForAi: totalPurchased > 0,
    };
  });

  const productIds = baseInsights.map((item) => Number(item.productId));
  const cacheSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cachedInsights = await db
    .select({
      productId: aiInsights.productId,
      action: aiInsights.action,
      stockRange: aiInsights.stockRange,
      recommendation: aiInsights.recommendation,
      createdAt: aiInsights.createdAt,
    })
    .from(aiInsights)
    .where(and(inArray(aiInsights.productId, productIds), gte(aiInsights.createdAt, cacheSince)))
    .orderBy(desc(aiInsights.createdAt));

  const cachedMap = new Map<number, typeof cachedInsights[number]>();
  for (const row of cachedInsights) {
    if (!cachedMap.has(row.productId)) {
      cachedMap.set(row.productId, row);
    }
  }

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
    return fallback.map((item) => {
      const cached = cachedMap.get(Number(item.productId));
      return cached
        ? {
            productId: item.productId,
            action: (cached.action as InsightAction) ?? item.action,
            stockRange: cached.stockRange ?? item.stockRange,
            message: cached.recommendation ?? item.message,
          }
        : item;
    });
  }

  const schema = z.object({
    insights: z.array(
      z.object({
        productId: z.string(),
        message: z.string(),
      }),
    ),
  });

  const aiCandidates = baseInsights.filter(
    (item) => item.eligibleForAi && !cachedMap.has(Number(item.productId)),
  );

  if (aiCandidates.length === 0) {
    return fallback.map((item) => {
      const cached = cachedMap.get(Number(item.productId));
      return cached
        ? {
            productId: item.productId,
            action: (cached.action as InsightAction) ?? item.action,
            stockRange: cached.stockRange ?? item.stockRange,
            message: cached.recommendation ?? item.message,
          }
        : item;
    });
  }

  const prompt = `Kamu adalah asisten ritel UMKM. Buat insight singkat Bahasa Indonesia untuk setiap produk (maks 1 kalimat). Gunakan action dan stockRange yang diberikan. Sebut totalPurchased atau avgDailyDemand bila relevan. Jangan menambah produk baru.

Time window: 30 days.

Products:
${aiCandidates
  .map(
    (item) =>
      `- productId: ${item.productId}, name: ${item.name}, stock: ${item.stock}, totalPurchased: ${item.totalPurchased}, avgDailyDemand: ${item.avgDailyDemand}, action: ${item.action}, stockRange: ${item.stockRange} unit`,
  )
  .join("\n")}

Return JSON: { insights: [{ productId, message }] }`;

  try {
    const result = await measureApiCall(
      () =>
        generateObject({
          model: google("gemini-2.5-flash"),
          schema,
          prompt,
          maxRetries: 0,
        }),
      "product_insights",
      session.user.id,
      "gemini-2.5-flash",
    );

    const messageMap = new Map(
      result.object.insights.map((item) => [item.productId, item.message]),
    );

    const insertRows = aiCandidates
      .map((item) => {
        const message = messageMap.get(item.productId);
        if (!message) return null;
        return {
          productId: Number(item.productId),
          action: item.action,
          recommendation: message,
          stockRange: item.stockRange,
        };
      })
      .filter(Boolean) as Array<{
      productId: number;
      action: InsightAction;
      recommendation: string;
      stockRange: string;
    }>;

    if (insertRows.length > 0) {
      await db.insert(aiInsights).values(insertRows);
    }

    return baseInsights.map((item, index) => {
      const cached = cachedMap.get(Number(item.productId));
      const message = messageMap.get(item.productId);
      return {
        productId: item.productId,
        action: item.action,
        stockRange: item.stockRange,
        message: message ?? cached?.recommendation ?? fallback[index].message,
      };
    });
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
