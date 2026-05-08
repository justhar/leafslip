"use client";

import React, { useState, useEffect } from "react";
import { getActiveListings, createReservation } from "@/app/actions/market";
import { Leaf, Search, Clock, MapPin, Store, CheckCircle, XCircle, ShoppingBag } from "lucide-react";

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function Marketplace() {
  const [listings, setListings] = useState<Awaited<ReturnType<typeof getActiveListings>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    quantity: 1,
    pickupTime: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await getActiveListings();
      setListings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    (l.merchantName && l.merchantName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const result = await createReservation({
        listingId: selectedItem.id,
        guestName: formData.name,
        guestPhone: formData.phone,
        quantity: Number(formData.quantity),
        pickupTime: formData.pickupTime
      });
      setSuccessCode(result.code);
      fetchListings(); // Refresh stock
    } catch (e: any) {
      alert(e.message || "Gagal membuat reservasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setSelectedItem(null);
    setSuccessCode(null);
    setFormData({ name: "", phone: "", quantity: 1, pickupTime: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#2D3E2D] text-white py-4 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#D9ED92] text-[#2D3E2D] p-1.5 rounded-md">
              <Leaf size={20} />
            </div>
            <h1 className="font-bold tracking-tight text-lg">LeafSlip Market</h1>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#2D3E2D] text-white pt-6 pb-12 px-4 rounded-b-3xl shadow-inner">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-black">Selamatkan makanan, hemat uang.</h2>
          <p className="text-sm text-gray-300">Temukan penawaran surplus terbaik dari warung dan UMKM di sekitarmu sebelum kehabisan!</p>
          <div className="relative mt-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D9ED92] sm:text-sm"
              placeholder="Cari roti, sayur, kue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="text-center text-sm font-bold text-gray-400 tracking-widest uppercase mt-12">
            Mencari penawaran...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center mt-12 flex flex-col items-center">
            <ShoppingBag size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">Tidak ada penawaran saat ini.</p>
            <p className="text-xs text-gray-400 mt-2">Coba cari kata kunci lain atau kembali lagi nanti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map(item => {
              const timeLeft = Math.max(0, new Date(item.expiresAt).getTime() - Date.now());
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#2D3E2D] line-clamp-2">{item.title}</h3>
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black shrink-0 ml-2">
                        Sisa {item.remainingQuantity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">{item.description}</p>
                    
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1 font-bold">
                      <Store size={12} /> {item.merchantName || "UMKM Partner"}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold">
                      <Clock size={12} /> Kedaluwarsa dlm {hoursLeft}j {minsLeft}m
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div>
                      <p className="text-lg font-black text-[#2D3E2D]">Rp{formatCurrency(item.price)}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedItem(item); setFormData(p => ({...p, quantity: 1})); }}
                      className="bg-[#D9ED92] text-[#2D3E2D] px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#c9dc82] transition-colors"
                    >
                      Reservasi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reservation Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            {successCode ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-black text-[#2D3E2D] mb-2">Reservasi Berhasil!</h2>
                <p className="text-sm text-gray-600 mb-6">Tunjukkan kode ini kepada penjual saat pengambilan barang.</p>
                
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 w-full mb-6 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">KODE PENGAMBILAN</span>
                  <p className="text-4xl font-black text-[#2D3E2D] tracking-widest">{successCode}</p>
                </div>
                
                <button 
                  onClick={closeDialog}
                  className="w-full bg-[#2D3E2D] text-white py-3 rounded-xl font-bold hover:bg-[#1a251a]"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="font-bold text-[#2D3E2D]">Reservasi Item</h2>
                  <button onClick={closeDialog} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
                </div>
                
                <div className="p-4 bg-yellow-50/50 border-b border-yellow-100">
                  <h3 className="font-bold text-[#2D3E2D] text-sm">{selectedItem.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{selectedItem.merchantName}</p>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-sm font-black text-[#2D3E2D]">Rp{formatCurrency(selectedItem.price)} / item</span>
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Sisa {selectedItem.remainingQuantity}</span>
                  </div>
                </div>

                <form onSubmit={handleReserve} className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nama Anda"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9ED92]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="0812..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9ED92]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kuantitas</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={selectedItem.remainingQuantity}
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9ED92]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Rencana Waktu Pengambilan</label>
                    <input
                      type="text"
                      required
                      value={formData.pickupTime}
                      onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
                      placeholder="Contoh: Hari ini jam 17:00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9ED92]"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-[#D9ED92] text-[#2D3E2D] py-3 rounded-xl font-black uppercase tracking-wider hover:bg-[#c9dc82] disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isSubmitting ? "Memproses..." : "Konfirmasi Reservasi"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
