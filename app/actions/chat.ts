"use server";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { products, receiptItems, receipts } from "@/db/schema";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { generateText, type ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { sql } from "drizzle-orm";
import { measureApiCall } from "@/app/lib/ai-instrumentation";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID").format(Math.round(value));

const buildSalesContext = async (userId: string) => {
  const db = getDb();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30);

  const startDateString = startDate.toISOString().slice(0, 10);
  const endDateString = now.toISOString().slice(0, 10);

  const totalRevenueExpr = sql<number>`coalesce(sum(${receiptItems.total}), 0)`;
  const totalItemsExpr = sql<number>`coalesce(sum(${receiptItems.quantity}), 0)`;
  const totalReceiptsExpr = sql<number>`count(distinct ${receipts.id})`;

  const [totals] = await db
    .select({
      revenue: totalRevenueExpr.mapWith(Number),
      items: totalItemsExpr.mapWith(Number),
      receipts: totalReceiptsExpr.mapWith(Number),
    })
    .from(receiptItems)
    .leftJoin(receipts, eq(receipts.id, receiptItems.receiptId))
    .where(
      and(eq(receipts.userId, userId), gte(receipts.date, startDateString)),
    );

  const totalQtyExpr = sql<number>`coalesce(sum(${receiptItems.quantity}), 0)`;
  const topProducts = await db
    .select({
      name: receiptItems.name,
      quantity: totalQtyExpr.mapWith(Number),
    })
    .from(receiptItems)
    .leftJoin(receipts, eq(receipts.id, receiptItems.receiptId))
    .where(
      and(eq(receipts.userId, userId), gte(receipts.date, startDateString)),
    )
    .groupBy(receiptItems.name)
    .orderBy(desc(totalQtyExpr))
    .limit(5);

  const lowStock = await db
    .select({ name: products.name, stock: products.stock })
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(asc(products.stock))
    .limit(5);

  const productCount = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(products)
    .where(eq(products.userId, userId));

  const contextLines = [
    `Periode data: ${startDateString} s/d ${endDateString}`,
    `Total struk: ${totals?.receipts ?? 0}`,
    `Total unit terjual: ${totals?.items ?? 0}`,
    `Total omzet: Rp${formatCurrency(totals?.revenue ?? 0)}`,
    `Jumlah produk terdaftar: ${productCount?.[0]?.count ?? 0}`,
  ];

  if (topProducts.length > 0) {
    contextLines.push(
      `Top produk: ${topProducts
        .map((row) => `${row.name} (${row.quantity} unit)`)
        .join(", ")}`,
    );
  } else {
    contextLines.push("Top produk: belum ada data penjualan.");
  }

  if (lowStock.length > 0) {
    contextLines.push(
      `Stok terendah: ${lowStock
        .map((row) => `${row.name} (${row.stock} unit)`)
        .join(", ")}`,
    );
  }

  return contextLines.join("\n");
};

/**
 * Chat endpoint with token instrumentation.
 * Estimated token cost: ~1500 tokens avg per call.
 */
export async function sendChatMessage(messages: ChatMessage[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const history = Array.isArray(messages)
    ? messages.slice(-10).filter((message) => message.content?.trim())
    : [];

  if (history.length === 0) {
    return "Silakan tulis pertanyaan Anda tentang bisnis atau penjualan.";
  }

  const context = await buildSalesContext(session.user.id);

  const modelMessages: ModelMessage[] = history.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const system = `Kamu adalah Leafslip AI, konsultan bisnis UMKM di Indonesia. Jawab dengan Bahasa Indonesia yang singkat, profesional, dan praktis. Gunakan data konteks penjualan untuk memberi saran yang relevan. Jika data tidak cukup, jelaskan kekurangannya dan beri saran umum yang aman.

Konteks bisnis (30 hari terakhir):
${context}`;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return "Layanan AI belum dikonfigurasi. Tambahkan GOOGLE_GENERATIVE_AI_API_KEY untuk mengaktifkan Advisor.";
  }

  try {
    const { text } = await measureApiCall(
      () =>
        generateText({
          model: google("gemini-2.5-flash"),
          system,
          messages: modelMessages,
          maxRetries: 0,
        }),
      "chat",
      session.user.id,
      "gemini-2.5-flash",
    );

    return text || "Maaf, saya belum bisa menjawab saat ini.";
  } catch (error) {
    return "Maaf, layanan AI sedang sibuk. Coba lagi sebentar ya.";
  }
}
