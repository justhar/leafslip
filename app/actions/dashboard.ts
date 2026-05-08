"use server";

import { auth } from "@/auth";
import { getReceipts } from "./receipts";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { measureApiCall } from "@/app/lib/ai-instrumentation";

export type TimePeriod = "weekly" | "monthly" | "12months";

export interface DashboardSummary {
  stats: {
    todayRevenue: number;
    todaySales: number;
    cashflowStatus: "positive" | "negative";
    cashflowAmount: number;
    growthRate: number;
  };
  revenueSeries: Record<TimePeriod, Array<{ name: string; revenue: number }>>;
  bestSelling: Record<TimePeriod, Array<{ name: string; sold: number }>>;
  insights: {
    revenue: string;
    bestSelling: string;
  };
  receipts: Awaited<ReturnType<typeof getReceipts>>;
}

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const formatWeekday = (value: Date) =>
  value.toLocaleDateString("id-ID", { weekday: "short" });

const formatMonth = (value: Date) =>
  value.toLocaleDateString("id-ID", { month: "short" });

const buildWeeklyBuckets = (now: Date) => {
  const start = addDays(startOfDay(now), -6);
  const days = Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
  return days.map((day) => ({
    key: toDateKey(day),
    label: formatWeekday(day),
  }));
};

const buildMonthlyBuckets = (now: Date) => {
  const start = addDays(startOfDay(now), -27);
  return Array.from({ length: 4 }, (_, idx) => {
    const bucketStart = addDays(start, idx * 7);
    const bucketEnd = addDays(bucketStart, 6);
    return {
      start: bucketStart,
      end: bucketEnd,
      label: `Ming ${idx + 1}`,
    };
  });
};

const buildYearBuckets = (now: Date) => {
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  return Array.from({ length: 12 }, (_, idx) => {
    const month = new Date(
      current.getFullYear(),
      current.getMonth() - 11 + idx,
      1,
    );
    return {
      year: month.getFullYear(),
      month: month.getMonth(),
      label: formatMonth(month),
    };
  });
};

const sumRevenueFromReceipts = (
  receipts: Awaited<ReturnType<typeof getReceipts>>,
  start: Date,
  end: Date,
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  let total = 0;

  for (const receipt of receipts) {
    const receiptDate = new Date(receipt.date);
    const time = receiptDate.getTime();
    if (time < startTime || time > endTime) continue;
    for (const item of receipt.items) {
      total += Number(item.total) || 0;
    }
  }

  return total;
};

const sumItemsFromReceipts = (
  receipts: Awaited<ReturnType<typeof getReceipts>>,
  start: Date,
  end: Date,
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  let total = 0;

  for (const receipt of receipts) {
    const receiptDate = new Date(receipt.date);
    const time = receiptDate.getTime();
    if (time < startTime || time > endTime) continue;
    for (const item of receipt.items) {
      total += Number(item.quantity) || 0;
    }
  }

  return total;
};

const getBestSelling = (
  receipts: Awaited<ReturnType<typeof getReceipts>>,
  start: Date,
  end: Date,
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const map = new Map<string, number>();

  for (const receipt of receipts) {
    const receiptDate = new Date(receipt.date);
    const time = receiptDate.getTime();
    if (time < startTime || time > endTime) continue;
    for (const item of receipt.items) {
      const name = item.name.trim();
      const qty = Number(item.quantity) || 0;
      map.set(name, (map.get(name) ?? 0) + qty);
    }
  }

  return Array.from(map.entries())
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
};

const buildFallbackInsights = (
  growthRate: number,
  topSelling: Array<{ name: string; sold: number }>,
) => {
  const revenue =
    growthRate > 0
      ? "Revenue tumbuh positif. Pertahankan momentum penjualan."
      : "Revenue masih stagnan. Pertimbangkan promo atau bundling.";

  const bestSelling =
    topSelling.length > 0
      ? `Produk terlaris saat ini: ${topSelling[0].name}. Pertimbangkan menjaga stoknya.`
      : "Belum ada data penjualan untuk periode ini.";

  return { revenue, bestSelling };
};

/**
 * Generate dashboard insights with token tracking.
 * Estimated token cost: ~1300 tokens avg, no cache currently.
 */
const generateInsights = async (params: {
  growthRate: number;
  todayRevenue: number;
  todaySales: number;
  cashflowAmount: number;
  bestSellingWeekly: Array<{ name: string; sold: number }>;
}) => {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return buildFallbackInsights(params.growthRate, params.bestSellingWeekly);
  }

  const prompt = `Kamu adalah asisten ritel UMKM. Tulis dua insight singkat dalam Bahasa Indonesia (maksimal 2 kalimat per insight).

Metrik:
- Omzet hari ini: Rp${params.todayRevenue}
- Item terjual hari ini: ${params.todaySales}
- Pertumbuhan (vs bulan lalu): ${params.growthRate}%
- Perubahan arus kas: Rp${params.cashflowAmount}
- Produk terlaris minggu ini: ${params.bestSellingWeekly
    .map((row) => `${row.name} (${row.sold})`)
    .join(", ")}

Format output:
RevenueInsight: <teks>
BestSellingInsight: <teks>
`;

  try {
    const { text } = await measureApiCall(
      () =>
        generateText({
          model: google("gemini-2.5-flash"),
          prompt,
        }),
      "dashboard",
      session.user.id,
      "gemini-2.5-flash",
    );

    const revenueMatch = text.match(/RevenueInsight:\s*(.+)/i);
    const bestSellingMatch = text.match(/BestSellingInsight:\s*(.+)/i);

    const revenue = revenueMatch?.[1]?.trim();
    const bestSelling = bestSellingMatch?.[1]?.trim();

    if (!revenue || !bestSelling) {
      return buildFallbackInsights(params.growthRate, params.bestSellingWeekly);
    }

    return { revenue, bestSelling };
  } catch (error) {
    return buildFallbackInsights(params.growthRate, params.bestSellingWeekly);
  }
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const receipts = await getReceipts();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);

  const weeklyBuckets = buildWeeklyBuckets(now);
  const monthlyBuckets = buildMonthlyBuckets(now);
  const yearBuckets = buildYearBuckets(now);

  const weeklySeries = weeklyBuckets.map((bucket) => {
    const day = new Date(bucket.key);
    const nextDay = addDays(day, 1);
    return {
      name: bucket.label,
      revenue: sumRevenueFromReceipts(receipts, day, nextDay),
    };
  });

  const monthlySeries = monthlyBuckets.map((bucket) => ({
    name: bucket.label,
    revenue: sumRevenueFromReceipts(receipts, bucket.start, bucket.end),
  }));

  const yearlySeries = yearBuckets.map((bucket) => {
    const start = new Date(bucket.year, bucket.month, 1);
    const end = new Date(bucket.year, bucket.month + 1, 1);
    return {
      name: bucket.label,
      revenue: sumRevenueFromReceipts(receipts, start, end),
    };
  });

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = currentMonthStart;

  const currentMonthRevenue = sumRevenueFromReceipts(
    receipts,
    currentMonthStart,
    addDays(new Date(now), 1),
  );
  const previousMonthRevenue = sumRevenueFromReceipts(
    receipts,
    previousMonthStart,
    previousMonthEnd,
  );

  const growthRate =
    previousMonthRevenue === 0
      ? currentMonthRevenue > 0
        ? 100
        : 0
      : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100;

  const cashflowAmount = currentMonthRevenue - previousMonthRevenue;

  const todayRevenue = sumRevenueFromReceipts(receipts, todayStart, todayEnd);
  const todaySales = sumItemsFromReceipts(receipts, todayStart, todayEnd);

  const insights = await generateInsights({
    growthRate: Number(growthRate.toFixed(1)),
    todayRevenue,
    todaySales,
    cashflowAmount,
    bestSellingWeekly: getBestSelling(
      receipts,
      addDays(todayStart, -6),
      todayEnd,
    ),
  });

  return {
    stats: {
      todayRevenue,
      todaySales,
      cashflowStatus: cashflowAmount >= 0 ? "positive" : "negative",
      cashflowAmount,
      growthRate: Number(growthRate.toFixed(1)),
    },
    revenueSeries: {
      weekly: weeklySeries,
      monthly: monthlySeries,
      "12months": yearlySeries,
    },
    bestSelling: {
      weekly: getBestSelling(receipts, addDays(todayStart, -6), todayEnd),
      monthly: getBestSelling(receipts, addDays(todayStart, -27), todayEnd),
      "12months": getBestSelling(
        receipts,
        new Date(now.getFullYear(), now.getMonth() - 11, 1),
        todayEnd,
      ),
    },
    insights,
    receipts,
  };
}
