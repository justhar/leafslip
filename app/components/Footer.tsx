import React from "react";
import { Leaf, Instagram, Facebook, Mail, Phone, ArrowUp } from "lucide-react";

interface FooterProps {
  scrollToTop: () => void;
}

export default function Footer({ scrollToTop }: FooterProps) {
  return (
    <footer
      className="bg-[#2D3E2D] text-white py-8 pt-8 rounded-t-3xl"
      id="contact"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
              <div className="text-[#D9ED92]">
                <Leaf size={20} />
              </div>
              <span>LEAFSLIP</span>
            </div>

            <div className="space-y-4 max-w-md">
              <h3 className="text-md font-light leading-snug">
                Building a{" "}
                <span className="text-[#D9ED92] font-medium italic">
                  paperless & waste-free
                </span>{" "}
                future for Indonesian small businesses.
              </h3>
            </div>
            {/* 
            <div className="flex gap-4">
              {[
                <Instagram key="ig" size={18} />,
                <Facebook key="fb" size={18} />,
                <Mail key="mail" size={18} />,
                <Phone key="phone" size={18} />,
              ].map((icon, idx) => (
                <button
                  key={idx}
                  className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#D9ED92] hover:text-[#2D3E2D] hover:border-[#D9ED92] transition-all hover:scale-110"
                >
                  {icon}
                </button>
              ))}
            </div> */}
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-6 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-6 flex-1">
              <div className="flex justify-end">
                <button
                  onClick={scrollToTop}
                  className="flex items-center gap-2 bg-white/5 border border-white/20 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Back to Top <ArrowUp size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
