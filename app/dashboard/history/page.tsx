"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  Package,
  Receipt,
  Trash2,
  Search,
  Calendar,
} from "lucide-react";
import { getReceipts, deleteReceipt } from "@/app/actions/receipts";

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Fetch receipts on component mount
  useEffect(() => {
    async function fetchReceipts() {
      try {
        const data = await getReceipts();
        setReceipts(data);
      } catch (error) {
        console.error("Failed to fetch receipts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  const filterByDate = (receipt: any) => {
    const receiptDate = new Date(receipt.date);
    const now = new Date();

    if (dateFilter === "all") return true;
    if (dateFilter === "7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return receiptDate >= sevenDaysAgo;
    }
    if (dateFilter === "30days") {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return receiptDate >= thirtyDaysAgo;
    }
    if (dateFilter === "thismonth") {
      return (
        receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  };

  const displayHistory = receipts.filter((receipt) => {
    if (!searchQuery.trim()) return filterByDate(receipt);

    const query = searchQuery.toLowerCase();
    const matchesMerchant = receipt.merchantName.toLowerCase().includes(query);
    const matchesDate = receipt.date.includes(query);
    const matchesItems = receipt.items.some((item: any) =>
      item.name.toLowerCase().includes(query),
    );

    return (
      (matchesMerchant || matchesDate || matchesItems) && filterByDate(receipt)
    );
  });

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
      <div>
        {/* Recent History Card */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
            Riwayat Terbaru
          </h3>

          {/* Search and Filter Bar */}
          <div className="flex gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari berdasarkan toko, tanggal, atau barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-md text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all"
              />
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative min-w-[180px]">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-md text-xs text-gray-700 focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all appearance-none cursor-pointer"
              >
                <option value="all">Semua Waktu</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="thismonth">Bulan Ini</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center mx-auto border border-gray-50 animate-pulse">
                  <Receipt className="text-gray-300" size={18} />
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Memuat data...
                </p>
              </div>
            ) : displayHistory.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center mx-auto border border-gray-50">
                  <Receipt className="text-gray-300" size={18} />
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Belum ada data
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {displayHistory.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-green-50 rounded flex-shrink-0 flex items-center justify-center text-green-600 border border-green-100">
                        <Receipt size={16} />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-[#2D3E2D] text-xs truncate">
                          {receipt.merchantName}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                          {receipt.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-black text-xs text-[#2D3E2D]">
                        Rp{formatCurrency(receipt.grandTotal)}
                      </p>
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="text-[8px] font-bold uppercase tracking-widest text-gray-300 hover:text-[#2D3E2D]"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedReceipt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedReceipt(null)}
          />
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-[92vw] max-w-xl max-h-[85vh] overflow-hidden">
            <div className="bg-[#2D3E2D] p-3 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold">
                <Receipt size={14} className="text-[#D9ED92]" />
                Detail Struk
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="hover:bg-white/10 p-1 rounded"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 bg-gray-50/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    Ringkasan
                  </p>
                  <p className="text-xs font-bold text-[#2D3E2D]">
                    {selectedReceipt.merchantName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    Tanggal
                  </p>
                  <p className="text-[11px] font-medium text-gray-600">
                    {selectedReceipt.date}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-200">
                  <tr className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <th className="px-4 py-2">Item</th>
                    <th className="px-2 py-2 w-12 text-center">Qty</th>
                    <th className="px-2 py-2 w-24 text-right">Harga</th>
                    <th className="px-4 py-2 w-24 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedReceipt.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 text-[11px] font-medium text-gray-700">
                        {item.name}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-center text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-right text-gray-600">
                        Rp{formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-right font-bold text-[#2D3E2D]">
                        Rp{formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">
                  Total
                </span>
                <span className="text-base font-black text-[#2D3E2D]">
                  Rp{formatCurrency(selectedReceipt.grandTotal)}
                </span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#2D3E2D]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
