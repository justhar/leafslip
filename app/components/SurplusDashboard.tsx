"use client";

import React, { useState, useEffect } from "react";
import { 
  Tag, 
  Plus, 
  Sparkles, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Box
} from "lucide-react";
import { getSurplusListings, getSurplusStats, createSurplusListing, generateSurplusDescription, verifyPickupCode } from "@/app/actions/surplus";
import { getProducts } from "@/app/actions/products";

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function SurplusDashboard() {
  const [listings, setListings] = useState<Awaited<ReturnType<typeof getSurplusListings>>>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getSurplusStats>> | null>(null);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    expiresAt: "",
    productId: ""
  });

  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [l, s, p] = await Promise.all([
        getSurplusListings(),
        getSurplusStats(),
        getProducts()
      ]);
      setListings(l);
      setStats(s);
      setProducts(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title) return;
    setIsAiLoading(true);
    try {
      const description = await generateSurplusDescription(formData.title);
      setFormData(prev => ({ ...prev, description }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productId) {
      const confirmMsg = "Peringatan: Membuat listing ini akan memotong stok produk utama Anda. Lanjutkan?";
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      await createSurplusListing({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        expiresAt: new Date(formData.expiresAt).toISOString(),
        productId: formData.productId ? Number(formData.productId) : undefined
      });
      setIsModalOpen(false);
      setFormData({ title: "", description: "", price: "", quantity: "", expiresAt: "", productId: "" });
      fetchData();
    } catch (e: any) {
      alert(e.message || "Failed to create listing");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) return;
    setIsVerifying(true);
    try {
      await verifyPickupCode(verifyCode.trim());
      alert("Reservasi berhasil diselesaikan!");
      setVerifyCode("");
      fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal memverifikasi kode");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#2D3E2D]">Surplus Market</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Kelola Stok Berlebih & Promo</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#D9ED92] text-[#2D3E2D] px-4 py-2 rounded-md font-bold text-xs hover:bg-[#c9dc82] transition-colors"
        >
          <Plus size={16} /> Buat Listing Baru
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-md border border-gray-300 py-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Memuat surplus...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center border border-green-100">
                  <Tag size={18} className="text-green-600" />
                </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Listing Aktif</p>
              <p className="text-2xl font-black text-[#2D3E2D]">{stats?.activeListings || 0}</p>
            </div>
            
            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center border border-blue-100">
                  <Box size={18} className="text-blue-600" />
                </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Item Direservasi</p>
              <p className="text-2xl font-black text-[#2D3E2D]">{stats?.totalReserved || 0}</p>
            </div>

            <div className="bg-white rounded-md border border-gray-300 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center border border-green-100">
                  <Banknote size={18} className="text-green-600" />
                </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Pendapatan</p>
              <p className="text-2xl font-black text-[#2D3E2D]">Rp{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-md border border-gray-300 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Daftar Listing</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Judul</th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Harga</th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sisa</th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-gray-400">Belum ada listing surplus</td>
                      </tr>
                    ) : (
                      listings.map(l => (
                        <tr key={l.id} className="border-b border-gray-50">
                          <td className="py-3 text-xs font-bold text-[#2D3E2D]">{l.title}</td>
                          <td className="py-3 text-xs text-gray-600">Rp{formatCurrency(l.price)}</td>
                          <td className="py-3 text-xs text-gray-600">{l.remainingQuantity}/{l.quantity}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              l.status === 'active' ? 'bg-green-100 text-green-800' :
                              l.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-md border border-gray-300 p-4 h-fit">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Verifikasi Reservasi</h3>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Kode Pengambilan (6 Digit)</label>
                  <input
                    type="text"
                    required
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="Contoh: A1B2C3"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D3E2D]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-[#2D3E2D] text-white py-2 rounded-md font-bold text-xs hover:bg-[#1a251a] disabled:opacity-50"
                >
                  {isVerifying ? "Memverifikasi..." : "Selesaikan Transaksi"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-[#2D3E2D]">Buat Listing Surplus</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Tautkan ke Produk (Opsional)</label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setFormData({ ...formData, productId: pid });
                    if (pid) {
                      const p = products.find(p => p.id === pid);
                      if (p && !formData.title) {
                        setFormData(prev => ({...prev, title: p.name, price: p.sellingPrice.toString()}));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="">Tanpa Tautan Produk</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                  ))}
                </select>
                {formData.productId && (
                  <p className="text-[10px] text-yellow-600 mt-1 flex items-center gap-1"><AlertTriangle size={12}/> Stok akan dipotong otomatis dari produk ini saat listing dibuat.</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Judul Listing</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Roti Tawar (Sisa Hari Ini)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Harga Diskon</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Kuantitas</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Kedaluwarsa Pada</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">Deskripsi</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateDescription}
                    disabled={isAiLoading || !formData.title}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#2D3E2D] bg-[#D9ED92] px-2 py-0.5 rounded hover:bg-[#c9dc82] disabled:opacity-50"
                  >
                    <Sparkles size={12} /> {isAiLoading ? "Generating..." : "Generate dengan AI"}
                  </button>
                </div>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi penawaran..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">Batal</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold bg-[#2D3E2D] text-white rounded-md hover:bg-[#1a251a]">Buat Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
