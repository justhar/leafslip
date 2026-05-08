import React from "react";
import { Leaf, Mail, Menu } from "lucide-react";
import { AppView } from "../types";
import Link from "next/link";

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenMobileMenu?: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  onOpenMobileMenu,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <div
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight text-[#2D3E2D] cursor-pointer"
        >
          <div className="text-[#D9ED92] bg-[#2D3E2D] p-1 md:p-1.5 rounded-lg">
            <Leaf size={18} />
          </div>
          <h1 className="font-extrabold">LEAFSLIP</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-[#D9ED92] text-[#2D3E2D] font-bold text-xs hover:scale-105 transition-transform shadow-sm"
            >
              Mulai Scan
            </Link>
          </div>

          {/* Mobile Burger Trigger - Top Right */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-[#2D3E2D] hover:bg-gray-100 rounded-lg"
            aria-label="Open Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
