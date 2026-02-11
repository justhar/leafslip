import React, { useState } from "react";
import {
  ScannedReceipt,
  StockRecommendation,
  TimePeriod,
  ReceiptItem,
} from "../types";
import { TrendingDown, TrendingUp, Zap, CalendarDays } from "lucide-react";

interface StockInsightsProps {
  receipts: ScannedReceipt[];
}

export default function StockInsights({ receipts }: StockInsightsProps) {
  const [period, setPeriod] = useState<TimePeriod>("weekly");

  const generateRecommendations = (): StockRecommendation[] => {
    if (receipts.length === 0) return [];
    const itemMap = new Map<string, { count: number; total: number }>();
    receipts.forEach((r) => {
      r.items.forEach((i: ReceiptItem) => {
        const existing = itemMap.get(i.name) || { count: 0, total: 0 };
        itemMap.set(i.name, {
          count: existing.count + 1,
          total: existing.total + i.quantity,
        });
      });
    });
    const recommendations: StockRecommendation[] = [];
    itemMap.forEach((val, key) => {
      if (val.total > 15)
        recommendations.push({
          itemName: key,
          action: "Restock",
          reason: "Perputaran cepat.",
          confidence: 0.94,
        });
      else if (val.total < 5)
        recommendations.push({
          itemName: key,
          action: "Reduce",
          reason: "Lambat; risiko kedaluwarsa.",
          confidence: 0.81,
        });
    });
    return recommendations.slice(0, 4);
  };

  const recs = generateRecommendations();

  return (
    <div className="bg-white p-4 md:p-8 lg:p-12 h-full flex flex-col min-h-[500px] animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2D3E2D] flex items-center gap-2">
          Waste Tracker
        </h3>

        <div className="flex bg-gray-50 p-0.5 rounded border border-gray-300">
          {(["weekly", "monthly", "yearly"] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                period === p
                  ? "bg-white border border-gray-300 text-[#2D3E2D]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3 opacity-30">
          <Zap size={32} className="text-gray-300" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            Belum ada data analisis
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec, idx) => (
            <div
              key={idx}
              className="border border-gray-300 rounded-md p-4 transition-all hover:border-[#D9ED92]"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-xs text-[#2D3E2D]">
                  {rec.itemName}
                </h4>
                <span
                  className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                    rec.action === "Restock"
                      ? "bg-green-50 text-green-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {rec.action}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
                {rec.reason}
              </p>
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-gray-300">
                  {rec.action === "Restock" ? (
                    <TrendingUp size={10} />
                  ) : (
                    <TrendingDown size={10} />
                  )}
                  {Math.round(rec.confidence * 100)}% Confidence
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-50">
        <p className="text-[8px] text-gray-300 uppercase font-black tracking-[0.2em] text-center">
          Leafslip Intelligence Predictor
        </p>
      </div>
    </div>
  );
}
