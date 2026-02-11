"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ReceiptScanner from "./components/ReceiptScanner";
import StockInsights from "./components/StockInsights";
import ServicesSection from "./components/ServicesSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import FullChatbot from "./components/FullChatbot";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import {
  FileText,
  Clock,
  Search,
  Filter,
  History,
  BrainCircuit,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { ScannedReceipt } from "./types";

export default function App() {
  const [history, setHistory] = useState<ScannedReceipt[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNewReceipt = (receipt: ScannedReceipt) => {
    setHistory((prev) => [receipt, ...prev]);
  };

  // Mock user data for Sidebar
  const mockUser = {
    name: "Demo User",
    email: "demo@leafslip.com",
    avatar: "https://i.pravatar.cc/150?u=demo",
    role: "MSME Owner",
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col lg:flex-row relative">
      {/* Sidebar Overlay for Mobile */}
      {/* {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#2D3E2D]/10 backdrop-blur-[2px] z-50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )} */}

      {/* Responsive Sidebar */}
      {/* <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView="dashboard"
        onNavigate={() => {}}
        user={mockUser}
        onLogout={() => console.log("Logout clicked")}
      /> */}

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
      <main className={`flex-1 min-h-screen flex flex-col`}>
        <div>
          <div className="min-h-screen selection:bg-[#D9ED92] selection:text-[#2D3E2D] bg-[#FDFDFD]">
            <Navbar
              currentView={"dashboard"}
              onNavigate={() => {}}
              onOpenMobileMenu={() => setIsSidebarOpen(true)}
            />
            <main>
              <Hero />
              <ServicesSection />
              <CTASection />
            </main>
            <Footer
              scrollToTop={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
