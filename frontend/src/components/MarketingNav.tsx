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

export function MarketingNav() {
  const auth = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

        {/* Center links — desktop only */}
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

        {/* Auth buttons — desktop only */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => auth.isAuthenticated ? window.location.href = "/agents" : auth.signinRedirect()}
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition px-3 py-2"
          >
            {auth.isAuthenticated ? "Dashboard" : "Log In"}
          </button>
          <button
            onClick={() => auth.isAuthenticated ? window.location.href = "/agents" : auth.signinRedirect()}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow hover:bg-blue-600 transition"
          >
            {auth.isAuthenticated ? "Open App →" : "Get Started Free →"}
          </button>
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 pb-6 pt-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={`text-base font-semibold transition ${
                pathname === href ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/challayashwanth1998-png/vega-rag"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-slate-700 flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Github className="w-4 h-4" /> GitHub
          </a>
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => { setIsOpen(false); auth.isAuthenticated ? window.location.href = "/agents" : auth.signinRedirect(); }}
              className="w-full py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              {auth.isAuthenticated ? "Dashboard" : "Log In"}
            </button>
            <button
              onClick={() => { setIsOpen(false); auth.isAuthenticated ? window.location.href = "/agents" : auth.signinRedirect(); }}
              className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shadow hover:bg-blue-600 transition"
            >
              {auth.isAuthenticated ? "Open App →" : "Get Started Free →"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
