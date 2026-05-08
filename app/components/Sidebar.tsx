"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AppView } from "../types";
import {
  Leaf,
  LayoutDashboard,
  Scan,
  TrendingUp,
  History,
  LogOut,
  MessageSquare,
  X,
  User as UserIcon,
  Tag,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentView?: AppView;
  onNavigate?: (view: AppView) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  currentView,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const displayUser = session?.user || {
    name: "Tamu",
    email: "tamu@leafslip.com",
    image: null,
  };

  const menuItems = [
    {
      id: "dashboard" as AppView,
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      href: "/dashboard",
    },
    {
      id: "scanner" as AppView,
      label: "Pemindai",
      icon: <Scan size={20} />,
      href: "/dashboard/scanner",
    },
    {
      id: "history" as AppView,
      label: "Riwayat",
      icon: <History size={20} />,
      href: "/dashboard/history",
    },
    {
      id: "products" as AppView,
      label: "Produk",
      icon: <TrendingUp size={20} />,
      href: "/dashboard/products",
    },
    {
      id: "surplus" as AppView,
      label: "Surplus",
      icon: <Tag size={20} />,
      href: "/dashboard/surplus",
    },
    {
      id: "chatbot" as AppView,
      label: "Chat AI",
      icon: <MessageSquare size={20} />,
      href: "/dashboard/chat",
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-white border-r border-gray-300 flex flex-col z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:w-20"
      }`}
    >
      {/* Branding Section */}
      <div className="px-2 py-6 lg:py-8 flex flex-col items-center justify-center font-bold tracking-tight text-[#2D3E2D] shrink-0">
        <div className="text-[#D9ED92] bg-[#2D3E2D] p-2 rounded-md mb-1 transition-transform hover:scale-105 active:scale-90">
          <Leaf size={18} />
        </div>
        <span className="text-[8px] tracking-[0.2em] hidden lg:block uppercase font-black text-gray-300">
          LEAF
        </span>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 top-6 p-2 hover:bg-gray-50 rounded text-gray-400"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Section - Scrollable but scrollbar is hidden */}
      <nav className="flex-1 px-1 lg:px-1 space-y-1 lg:space-y-0.5 mt-2 overflow-y-auto hide-scrollbar flex flex-col items-center">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                onNavigate?.(item.id);
                onClose?.();
              }}
              className={`w-full flex lg:flex-col items-center gap-3 lg:gap-1.5 px-3 py-3 lg:py-4 transition-all group relative z-10 ${
                isActive
                  ? "text-[#2D3E2D]"
                  : "text-gray-400 hover:text-[#2D3E2D]"
              }`}
            >
              {/* Minimal Highlight Pop Effect */}
              {isActive && (
                <div className="absolute inset-x-1.5 lg:inset-x-1 inset-y-1 lg:inset-y-1.5 bg-[#D9ED92]/60 rounded-md -z-10 animate-highlight" />
              )}

              <div
                className={`transition-transform group-hover:scale-110 ${
                  isActive ? "text-[#2D3E2D]" : ""
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] lg:text-[8.5px] font-bold uppercase tracking-wide leading-tight text-center truncate w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Account Section - Fixed at bottom */}
      <div className="p-2 border-t border-gray-50 flex flex-col items-center shrink-0 space-y-2">
        {/* User Info - Only visible when open */}
        {isOpen && session?.user && (
          <div className="w-full px-2 py-2 text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-200 mx-auto flex items-center justify-center overflow-hidden">
              {displayUser.image ? (
                <img
                  src={displayUser.image}
                  alt={displayUser.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={20} className="text-green-600" />
              )}
            </div>
            <p className="text-[9px] font-bold text-gray-700 truncate">
              {displayUser.name}
            </p>
            <p className="text-[8px] text-gray-400 truncate">
              {displayUser.email}
            </p>
          </div>
        )}

        <button
          onClick={() => {
            signOut({ callbackUrl: "/" });
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
          title="Keluar"
        >
          <LogOut size={16} />
          <span className="lg:hidden font-bold text-[10px] uppercase">
            Keluar
          </span>
        </button>
      </div>
    </aside>
  );
}
