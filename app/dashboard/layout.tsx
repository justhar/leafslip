"use client";

import React from "react";
import Sidebar from "../components/Sidebar";
import { Menu, Leaf } from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col lg:flex-row relative">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#2D3E2D]/10 backdrop-blur-[2px] z-50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Sticky Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-300 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2 font-bold text-[11px] tracking-tight text-[#2D3E2D]">
          <div className="text-[#D9ED92] bg-[#2D3E2D] p-1 rounded">
            <Leaf size={14} />
          </div>
          <span className="uppercase tracking-widest font-bold">LEAFSLIP</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-[#2D3E2D] hover:bg-gray-50 rounded-md transition-colors"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-20 min-h-screen">{children}</main>
    </div>
  );
}
