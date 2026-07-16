import React from "react";
import { AIMS, BENEFITS } from "../constants";
import { CheckCircle2 } from "lucide-react";

export default function FeatureSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 md:py-32" id="about">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Left Side: Aims Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-[#D9ED92]/40 rounded-[32px] p-8 space-y-8 sticky top-32">
            <h2 className="text-2xl font-bold tracking-tight uppercase">
              MISI KAMI
            </h2>

            <div className="space-y-6">
              {AIMS.map((aim: any) => (
                <div key={aim.id} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-7 h-7 bg-[#2D3E2D] text-[#D9ED92] rounded-full flex items-center justify-center text-xs font-bold">
                    {aim.id}
                  </span>
                  <p className="text-[#2D3E2D] font-medium leading-tight pt-0.5">
                    {aim.text}
                  </p>
                </div>
              ))}
            </div>

            <button className="w-full bg-[#D9ED92] text-[#2D3E2D] py-3.5 rounded-full font-bold text-sm hover:brightness-95 transition-all shadow-sm">
              Lihat Dampak Pertumbuhan
            </button>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="lg:col-span-8 space-y-12">
          {/* Main Image */}
          <div className="relative group overflow-hidden rounded-[40px] shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Pemilik UMKM ritel"
              className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-8 left-8">
              <span className="bg-white/90 backdrop-blur-md text-[#2D3E2D] px-6 py-2 rounded-full font-bold text-sm shadow-xl">
                Dukung UMKM & Toko Ritel
              </span>
            </div>
          </div>

          {/* Description Text */}
          <div className="space-y-6">
            <h3 className="text-4xl font-bold tracking-tighter">
              Lebih Dari Sekadar Scan
            </h3>
            <p className="text-xl text-gray-600 leading-relaxed font-light">
              Greenslip menutup "celah kertas" untuk UMKM Indonesia. Dengan
              mengubah struk manual menjadi data digital yang bisa ditindak,
              UMKM mendapat kekuatan analitik setara bisnis besar. Tidak ada
              lagi catatan hilang atau stok menebak-nebak—hanya insight AI yang
              membantu belanja sesuai kebutuhan.
            </p>

            <div className="space-y-6 pt-4">
              <h3 className="text-2xl font-bold">
                Kenapa UMKM Memilih Greenslip
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BENEFITS.map((benefit) => (
                  <li
                    key={benefit.id}
                    className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-300 shadow-sm"
                  >
                    <div className="w-5 h-5 bg-[#D9ED92] text-[#2D3E2D] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {benefit.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Card */}
          <div className="bg-[#2D3E2D] rounded-[40px] shadow-xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 text-white">
            <div className="relative w-full md:w-1/3">
              <div className="w-48 h-48 md:w-full md:h-64 bg-white/5 rounded-[32px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1515168833906-d2a3b82b302a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Rak produk ritel"
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            </div>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-[#D9ED92]">
                  Teknologi di Baliknya
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Kami memakai Gemini untuk membaca struk Indonesia di berbagai
                  kondisi cahaya. Algoritme kami menganalisis pola penjualan
                  untuk menandai item berisiko menumpuk atau kehabisan.
                </p>
              </div>
              <div className="flex justify-center md:justify-start">
                <button className="bg-[#D9ED92] text-[#2D3E2D] px-8 py-3 rounded-full font-bold hover:brightness-110 transition-all shadow-lg shadow-lime-500/10">
                  Coba Analisis AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
