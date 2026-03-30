"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AgentSidebar } from "@/components/AgentSidebar";
import { Menu, X } from "lucide-react";
import { useParams } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { botId } = useParams() as { botId?: string };

  const SidebarToRender = botId ? <AgentSidebar botId={botId} /> : <Sidebar />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex shrink-0 h-full w-64 border-r border-slate-100">
        {SidebarToRender}
      </div>

      {/* Mobile Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white z-[70] transform transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full relative font-sans">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-5 right-5 p-2 bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-64">
             <Sidebar />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Mobile Header (only mobile) */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0 z-50">
          <span className="font-bold text-lg tracking-tight text-slate-900">VegaRAG Dash</span>
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
