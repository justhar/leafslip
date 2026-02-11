"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardSummary, TimePeriod } from "@/app/actions/dashboard";

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function Dashboard() {
  const [revenuePeriod, setRevenuePeriod] = useState<TimePeriod>("weekly");
  const [bestSellingPeriod, setBestSellingPeriod] =
    useState<TimePeriod>("weekly");
  const { data: session } = useSession();
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof getDashboardSummary>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayUser = {
    name: session?.user?.name || "Pengguna",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
    role: "Pemilik Warung",
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    getDashboardSummary()
      .then((data) => {
        if (isMounted) {
          setSummary(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Gagal memuat dashboard.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Get data based on selected period
  const getRevenueData = () => {
    return summary?.revenueSeries[revenuePeriod] ?? [];
  };

  const getBestSellingData = () => {
    return summary?.bestSelling[bestSellingPeriod] ?? [];
  };

  const stats = summary?.stats;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {loading && (
        <div className="bg-white rounded-md border border-gray-300 py-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Memuat dashboard...
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-md border border-gray-300 py-12 text-center text-[10px] text-red-500 font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-sm font-bold text-[#2D3E2D] border border-gray-300 overflow-hidden">
              {displayUser.avatar ? (
                <img
                  src={displayUser.avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayUser.name.charAt(0)
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#2D3E2D]">
                Halo, {displayUser.name}!
              </h1>
              <span className="inline-block px-2 py-0.5 bg-[#D9ED92] text-[#2D3E2D] text-[8px] font-bold uppercase rounded">
                {displayUser.role}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue Hari Ini */}
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center border border-green-100">
                  <DollarSign size={18} className="text-green-600" />
                </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Omzet Hari Ini
              </p>
              <p className="text-2xl font-black text-[#2D3E2D]">
                Rp{formatCurrency(stats?.todayRevenue ?? 0)}
              </p>
            </div>

            {/* Total Sales Hari Ini */}
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center border border-blue-100">
                  <ShoppingCart size={18} className="text-blue-600" />
                </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Items Terjual Hari Ini
              </p>
              <p className="text-2xl font-black text-[#2D3E2D]">
                {stats?.todaySales ?? 0} <span className="text-sm">item</span>
              </p>
            </div>

            {/* Cashflow Status */}
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center border ${
                    stats?.cashflowStatus === "positive"
                      ? "bg-green-50 border-green-100"
                      : "bg-red-50 border-red-100"
                  }`}
                >
                  <Activity
                    size={18}
                    className={
                      stats?.cashflowStatus === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  />
                </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Status Arus Kas
              </p>
              <p
                className={`text-lg font-black uppercase ${
                  stats?.cashflowStatus === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats?.cashflowStatus === "positive"
                  ? "Sehat"
                  : "Butuh Perhatian"}
              </p>
            </div>

            {/* Growth Rate */}
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center border ${
                    (stats?.growthRate ?? 0) >= 0
                      ? "bg-green-50 border-green-100"
                      : "bg-red-50 border-red-100"
                  }`}
                >
                  {(stats?.growthRate ?? 0) >= 0 ? (
                    <TrendingUp size={18} className="text-green-600" />
                  ) : (
                    <TrendingDown size={18} className="text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Laju Pertumbuhan (vs Bulan Lalu)
              </p>
              <p
                className={`text-2xl font-black ${
                  (stats?.growthRate ?? 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(stats?.growthRate ?? 0) >= 0 ? "+" : ""}
                {stats?.growthRate ?? 0}%
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Line Chart */}
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                  Omzet Per Hari
                </h3>
                <select
                  value={revenuePeriod}
                  onChange={(e) =>
                    setRevenuePeriod(e.target.value as TimePeriod)
                  }
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-600 focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all cursor-pointer"
                >
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="12months">12 Bulan</option>
                </select>
              </div>

              {/* AI Insight Box */}
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-green-600" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-green-700">
                    Insight AI
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-green-700">
                  {summary?.insights?.revenue ??
                    "Revenue masih stagnan. Pertimbangkan promo atau bundling."}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={getRevenueData()}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number | undefined) => [
                      `Rp${formatCurrency(value || 0)}`,
                      "Omzet",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2D3E2D"
                    strokeWidth={2}
                    dot={{ fill: "#D9ED92", r: 4 }}
                    activeDot={{ r: 6, fill: "#2D3E2D" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Best Selling Items Bar Chart */}
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                  Produk Terlaris
                </h3>
                <select
                  value={bestSellingPeriod}
                  onChange={(e) =>
                    setBestSellingPeriod(e.target.value as TimePeriod)
                  }
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-600 focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all cursor-pointer"
                >
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="12months">12 Bulan</option>
                </select>
              </div>

              {/* AI Insight Box */}
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={14} className="text-blue-600" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-700">
                    Insight AI
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-blue-700">
                  {summary?.insights?.bestSelling ??
                    "Belum ada data penjualan untuk periode ini."}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={getBestSellingData()}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number | undefined) => [
                      `${value || 0} item`,
                      "Terjual",
                    ]}
                  />
                  <Bar dataKey="sold" fill="#D9ED92" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
