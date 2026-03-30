"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutGrid, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MarketingNav() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Story", href: "/story" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition duration-300">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 italic">VegaRAG</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition tracking-tight uppercase"
            >
              {link.name}
            </Link>
          ))}
          <Link 
            href="/agents" 
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition shadow-xl"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 inset-x-0 bg-white border-b border-slate-100 p-6 md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-5">
              {links.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className="text-base font-black text-slate-800 hover:text-blue-600 uppercase tracking-widest flex items-center justify-between group"
                >
                  {link.name}
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
                </Link>
              ))}
              <Link 
                href="/agents" 
                onClick={() => setIsOpen(false)}
                className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg"
              >
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
