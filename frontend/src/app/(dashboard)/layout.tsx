"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full w-64 shrink-0 border-r border-slate-200">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white z-[70] transform transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full relative">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-5 right-5 p-2 bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">VegaRAG</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
