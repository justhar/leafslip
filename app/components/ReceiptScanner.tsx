"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScannedReceipt, ReceiptItem } from "../types";
import { createReceipt, extractReceiptItems } from "../actions/receipts";
import {
  Loader2,
  Upload,
  Camera,
  X,
  Scan,
  Trash2,
  Calendar,
  Save,
  RotateCcw,
} from "lucide-react";

interface ReceiptScannerProps {
  onReceiptProcessed: (receipt: ScannedReceipt) => void;
}

export default function ReceiptScanner({
  onReceiptProcessed,
}: ReceiptScannerProps) {
  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID").format(Math.round(value || 0));

  const parseRupiah = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    return digits ? Number(digits) : 0;
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<ScannedReceipt | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setPendingReceipt(null);
    setSaveError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      alert("Tidak bisa mengakses kamera. Periksa izin perangkat.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 100);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        stopCamera();
        processImage(dataUrl);
      }
    }
  };

  const processImage = async (base64Data: string) => {
    setIsProcessing(true);
    setSaveError(null);
    try {
      const result = await extractReceiptItems(base64Data);
      const items: ReceiptItem[] = result.items.map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.price);
        return {
          name: item.name,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      });

      const grandTotal = items.reduce((acc, item) => acc + item.total, 0);

      const summary = items
        .map((item) => item.name)
        .filter(Boolean)
        .slice(0, 5)
        .join(", ");

      setPendingReceipt({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().slice(0, 10),
        merchantName: summary || "Hasil Scan",
        items,
        grandTotal,
        category: "Other",
      });
    } catch (error) {
      alert("Gagal memproses struk. Coba foto yang lebih jelas.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    if (!pendingReceipt) return;
    const newItems = [...pendingReceipt.items];
    if (field === "name") {
      newItems[index] = { ...newItems[index], name: String(value) };
    } else {
      const normalizedValue =
        typeof value === "number" && Number.isFinite(value) ? value : 0;
      newItems[index] = { ...newItems[index], [field]: normalizedValue };
    }
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].total =
        newItems[index].quantity * newItems[index].unitPrice;
    }
    const newGrandTotal = newItems.reduce((acc, item) => acc + item.total, 0);
    const summary = newItems
      .map((item) => item.name)
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");
    setPendingReceipt({
      ...pendingReceipt,
      items: newItems,
      grandTotal: newGrandTotal,
      merchantName: summary || "Hasil Scan",
    });
  };

  const removeItem = (index: number) => {
    if (!pendingReceipt) return;
    const newItems = pendingReceipt.items.filter((_, i) => i !== index);
    const newGrandTotal = newItems.reduce((acc, item) => acc + item.total, 0);
    const summary = newItems
      .map((item) => item.name)
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");
    setPendingReceipt({
      ...pendingReceipt,
      items: newItems,
      grandTotal: newGrandTotal,
      merchantName: summary || "Hasil Scan",
    });
  };

  const addItem = () => {
    if (!pendingReceipt) return;
    const newItems = [
      ...pendingReceipt.items,
      { name: "", quantity: 1, unitPrice: 0, total: 0 },
    ];
    const summary = newItems
      .map((item) => item.name)
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");
    setPendingReceipt({
      ...pendingReceipt,
      items: newItems,
      merchantName: summary || "Hasil Scan",
    });
  };

  const handleSave = async () => {
    if (!pendingReceipt) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await createReceipt({
        date: pendingReceipt.date,
        merchantName: pendingReceipt.merchantName || "Hasil Scan",
        items: pendingReceipt.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        grandTotal: pendingReceipt.grandTotal,
        category: pendingReceipt.category,
      });
      if (result?.newProductNames?.length) {
        localStorage.setItem(
          "leafslip:newProducts",
          JSON.stringify({
            names: result.newProductNames,
            at: Date.now(),
          }),
        );
      }
      onReceiptProcessed(pendingReceipt);
      setPendingReceipt(null);
    } catch (error) {
      setSaveError("Gagal menyimpan. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (pendingReceipt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col mx-auto animate-in zoom-in-95 duration-200 w-[92vw] max-w-xl max-h-[85vh]">
          <div className="bg-[#2D3E2D] p-3 flex justify-between items-center text-white">
            <h2 className="font-bold flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
              <Scan size={14} className="text-[#D9ED92]" />
              Verifikasi Data
            </h2>
            <button
              onClick={() => setPendingReceipt(null)}
              disabled={isSaving}
              className="hover:bg-white/10 p-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 border-b border-gray-300 grid grid-cols-2 gap-3 items-center bg-gray-50/30">
            <div>
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                Ringkasan Belanja
              </label>
              <input
                value={pendingReceipt.merchantName}
                readOnly
                className="bg-transparent font-bold text-[#2D3E2D] text-xs w-full outline-none focus:text-green-800"
              />
            </div>
            <div className="text-right">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                Tanggal
              </label>
              <input
                value={pendingReceipt.date}
                onChange={(e) =>
                  setPendingReceipt({ ...pendingReceipt, date: e.target.value })
                }
                className="bg-transparent font-medium text-gray-600 text-[11px] w-full outline-none text-right"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-gray-300">
                <tr className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-3 py-2">Daftar Item</th>
                  <th className="px-2 py-2 w-12 text-center">Qty</th>
                  <th className="px-2 py-2 w-24 text-right">Harga</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingReceipt.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 group">
                    <td className="px-3 py-1.5">
                      <input
                        value={item.name}
                        placeholder="Nama Item"
                        onChange={(e) =>
                          updateItem(idx, "name", e.target.value)
                        }
                        className="w-full bg-transparent text-[11px] font-medium text-gray-700 outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={
                          Number.isFinite(item.quantity) ? item.quantity : ""
                        }
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "quantity",
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                        className="w-full bg-transparent text-[11px] text-center outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatRupiah(item.unitPrice)}
                        onChange={(e) =>
                          updateItem(idx, "unitPrice", parseRupiah(e.target.value))
                        }
                        className="w-full bg-transparent text-[11px] text-right font-bold text-[#2D3E2D] outline-none"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => removeItem(idx)}
                        disabled={isSaving}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className=" pb-3 pl-3 w-full items-center justify-end">
              <button
                onClick={addItem}
                disabled={isSaving}
                className="text-[10px] font-bold text-[#2D3E2D] bg-[#D9ED92] px-2.5 py-1 rounded hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                + Tambah Item
              </button>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-300 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">
                Subtotal
              </span>
              <span className="text-base font-black text-[#2D3E2D]">
                Rp{formatRupiah(pendingReceipt.grandTotal)}
              </span>
              {saveError ? (
                <span className="block text-[10px] text-red-500 mt-1">
                  {saveError}
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPendingReceipt(null);
                  startCamera();
                }}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RotateCcw size={12} />
                Scan Ulang
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#D9ED92] text-[#2D3E2D] px-4 py-1.5 rounded-md font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {isSaving ? "Menyimpan" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg h-full border border-gray-300 mx-auto overflow-hidden">
      {isProcessing ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#2D3E2D] animate-spin" />
          <div>
            <h3 className="text-sm font-bold text-[#2D3E2D]">
              Gemini sedang membaca...
            </h3>
            <p className="text-[10px] text-gray-400">
              Digitalisasi struk sedang diproses.
            </p>
          </div>
        </div>
      ) : isCameraActive ? (
        <div className="relative h-[350px] sm:h-[400px] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-72 border border-[#D9ED92]/30 rounded shadow-[0_0_0_100vw_rgba(0,0,0,0.5)]"></div>
          </div>
          {isFlashing && <div className="absolute inset-0 bg-white z-50"></div>}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
            <button
              onClick={stopCamera}
              className="w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <X size={16} />
            </button>
            <button
              onClick={capturePhoto}
              className="w-12 h-12 bg-white rounded-full border-2 border-[#D9ED92] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 bg-[#2D3E2D] rounded-full flex items-center justify-center">
                <Camera className="text-[#D9ED92]" size={16} />
              </div>
            </button>
            <div className="w-8"></div>
          </div>
        </div>
      ) : (
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm text-[#2D3E2D] font-bold">
                Input Data Struk
              </h3>
              <p className="text-[10px] text-gray-500 tracking-tight">
                AI akan mengekstrak data dari struk Anda.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Upload size={12} />
                Unggah
              </button>
              <button
                onClick={startCamera}
                className="flex items-center gap-1.5 bg-[#2D3E2D] text-[#D9ED92] px-3 py-1.5 rounded-md text-[10px] font-bold hover:brightness-125 transition-all"
              >
                <Camera size={12} />
                Kamera
              </button>
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed flex-1 border-gray-50 rounded-lg p-8 text-center hover:border-[#D9ED92] hover:bg-green-50/10 transition-all cursor-pointer group flex flex-col items-center justify-center"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () =>
                    processImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              accept="image/*"
            />
            <div className="bg-gray-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-50 transition-colors">
              <Scan
                className="text-gray-300 group-hover:text-[#2D3E2D]"
                size={20}
              />
            </div>
            <p className="text-[11px] font-medium text-gray-400 group-hover:text-gray-500">
              Klik atau drop foto struk di sini
            </p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
