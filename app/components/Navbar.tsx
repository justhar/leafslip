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

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest">
          <button
            onClick={() => onNavigate("scanner")}
            className={`transition-all ${
              currentView === "scanner"
                ? "text-[#2D3E2D] border-b-2 border-[#D9ED92]"
                : "text-gray-400 hover:text-[#2D3E2D]"
            }`}
          >
            Scanner
          </button>
          <button
            onClick={() => onNavigate("recommender")}
            className={`transition-all ${
              currentView === "recommender"
                ? "text-[#2D3E2D] border-b-2 border-[#D9ED92]"
                : "text-gray-400 hover:text-[#2D3E2D]"
            }`}
          >
            Waste Tracker
          </button>
          <button
            onClick={() => onNavigate("history")}
            className={`transition-all ${
              currentView === "history"
                ? "text-[#2D3E2D] border-b-2 border-[#D9ED92]"
                : "text-gray-400 hover:text-[#2D3E2D]"
            }`}
          >
            History
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onNavigate("chatbot")}
              className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <Mail size={16} />
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-[#D9ED92] text-[#2D3E2D] font-bold text-xs hover:scale-105 transition-transform shadow-sm"
            >
              Start Scanning
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
