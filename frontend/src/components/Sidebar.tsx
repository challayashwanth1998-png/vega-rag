"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BarChart3, Settings, LogOut, BotMessageSquare } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { motion } from "framer-motion";

const navItems = [
  { name: "Agents", href: "/agents", icon: BotMessageSquare },
  { name: "Usage Analytics", href: "/usage", icon: BarChart3 },
  { name: "Workspace Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() || "";
  const auth = useAuth();

  const creditsUsed = 18;
  const creditsTotal = 50;
  const percent = Math.round((creditsUsed / creditsTotal) * 100);

  // Hide the global sidebar when inside a specific agent's detailed view
  if (pathname.startsWith('/agents/') && pathname !== '/agents') {
    return null;
  }

  return (
    <div className="h-screen w-64 bg-slate-50 border-r border-slate-200 flex flex-col text-slate-800 shadow-sm z-10 shrink-0">
      {/* Brand & Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <LayoutGrid className="text-white w-4 h-4" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">VegaRAG</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.name}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Usage Meter Widget */}
      <div className="p-4 mx-4 mb-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits</span>
          <span className="text-xs font-bold text-slate-700">{creditsUsed} / {creditsTotal}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">Free tier resets in 12 days</p>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
            {auth.user?.profile?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="text-sm font-medium truncate">{auth.user?.profile?.email || "Authenticated"}</span>
        </div>
        <button 
          onClick={() => {
            const logoutUrl = `https://us-east-1b7zudvphb.auth.us-east-1.amazoncognito.com/logout?client_id=40ps5mipuj6g2vhhec9skkiog2&logout_uri=${encodeURIComponent(window.location.origin)}`;
            auth.removeUser(); // Clear local state first
            window.location.href = logoutUrl;
          }} 
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
