"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "react-oidc-context";
import { Bot, Github, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "How it Works", href: "/features" },
  { label: "How to Deploy", href: "/deploy" },
  { label: "Pricing",      href: "/pricing" },
  { label: "My Story",     href: "/story" },
  { label: "Blog",         href: "/blog" },
];

export function Sidebar() {
  const pathname = usePathname() || "";
  let auth: any = null;
  try {
    auth = useAuth();
  } catch (e) {
    // Auth context not provided
  }
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo → home */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">VegaRAG</span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-semibold transition ${
                pathname === href
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/challayashwanth1998-png/vega-rag"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
          >
            <Github className="w-4 h-4" /> GitHub
          </a>
        </div>

        {/* Auth buttons (hidden on mobile, replaced by hamburger) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => auth?.isAuthenticated ? (window.location.href = "/agents") : auth?.signinRedirect?.()}
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition px-3 py-2"
          >
            {auth?.isAuthenticated ? "Dashboard" : "Log In"}
          </button>
          <button
            onClick={() => auth?.isAuthenticated ? (window.location.href = "/agents") : auth?.signinRedirect?.()}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow hover:bg-blue-600 transition"
          >
            {auth?.isAuthenticated ? "Open App →" : "Get Started Free →"}
          </button>
        </div>

        {/* Hamburger Toggle (mobile only) */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Menu (Slidedown) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 py-6 px-8 flex flex-col gap-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMenuOpen(false)}
              className={`text-lg font-bold transition ${
                pathname === href ? "text-blue-600" : "text-slate-700"
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/challayashwanth1998-png/vega-rag"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold text-slate-700 flex items-center gap-3"
          >
            <Github className="w-5 h-5 text-slate-400" /> GitHub
          </a>
          <div className="pt-4 flex flex-col gap-4">
             <button
               onClick={() => auth.isAuthenticated ? window.location.href = "/agents" : auth.signinRedirect()}
               className="w-full py-4 text-slate-700 font-bold border-2 border-slate-100 rounded-2xl"
             >
               {auth.isAuthenticated ? "Dashboard" : "Log In"}
             </button>
             <button
               onClick={() => auth.isAuthenticated ? window.location.href = "/agents" : auth.signinRedirect()}
               className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-600 transition"
             >
               {auth.isAuthenticated ? "Open App" : "Get Started Free"}
             </button>
          </div>
        </div>
      )}
    </nav>
  );
}
