import React from "react";
import Link from "next/link";
import { IMPACT_STATS } from "../constants";

export default function Hero() {
  return (
    <section className="h-screen">
      <div className="bg-[#2D3E2D] h-full py-auto justify-around text-white overflow-hidden">
        <div className="mx-10 h-full px-6 pt-10 md:pt-22 pb-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full">
            <div className="lg:col-span-7">
              <span className="inline-block bg-[#D9ED92] text-[#2D3E2D] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Digitalisasi UMKM Indonesia
              </span>
              <h1 className="text-6xl font-bold leading-[0.95] mb-4 tracking-tighter">
                Leafslip:
                <br />
                <span className="text-[#D9ED92]">Anti-Overstock</span> UMKM.
              </h1>
              <p className="text-md md:text-md text-gray-300 font-light leading-relaxed mb-10 max-w-lg">
                Hentikan stok menumpuk yang bikin rugi. Ubah struk kertas jadi
                catatan digital dan dapatkan rekomendasi stok dari AI dalam
                hitungan detik.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="bg-[#D9ED92] text-[#2D3E2D] px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 shadow-lg shadow-lime-500/10 inline-block"
                >
                  Scan Struk Pertamamu
                </Link>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/150?u=${i}`}
                      className="w-10 h-10 rounded-full border-2 border-[#2D3E2D]"
                      alt="user"
                    />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#2D3E2D] bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                    +12k
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 gap-6">
              {IMPACT_STATS.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-4xl flex items-center gap-4 hover:bg-white/10 transition-all group"
                >
                  <div className="p-3 bg-[#D9ED92] text-[#2D3E2D] rounded-2xl group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D9ED92] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
      </div>
    </section>
  );
}
