import React from "react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="px-6 py-12 md:py-20">
      <div className="max-w-7xl mx-auto rounded-[40px] md:rounded-[60px] overflow-hidden relative min-h-[500px] flex items-center justify-center text-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1515168833906-d2a3b82b302a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Toko ritel UMKM"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#2D3E2D]/80 backdrop-blur-[2px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 max-w-2xl text-white">
          <span className="inline-block border border-[#D9ED92]/50 text-[#D9ED92] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
            BERGABUNG DENGAN 12.000+ UMKM
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
            Siap Tinggalkan Pencatatan Manual?
          </h2>
          <p className="text-lg text-gray-200 mb-10 font-light leading-relaxed">
            Lindungi bisnis dari stok menumpuk, optimalkan perputaran barang,
            dan gunakan rekomendasi AI Greenslip untuk keputusan belanja yang
            lebih tepat.
          </p>
          <Link
            href="/dashboard"
            className="bg-[#D9ED92] text-[#2D3E2D] px-10 py-4 rounded-full font-bold text-lg hover:brightness-110 transition-all shadow-2xl inline-block"
          >
            Mulai Pakai Greenslip
          </Link>
        </div>
      </div>
    </section>
  );
}
