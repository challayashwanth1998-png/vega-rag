"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Loader2, LogIn, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Auth Context ──────────────────────────────────────────────────────────── */
interface AuthContextType {
  userEmail: string | null;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType>({ userEmail: null, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

/* ─── Session helpers (sessionStorage — cleared on tab close) ─────────────── */
const sessionKey = (botId: string) => `vegaChat_${botId}_user`;

function getStoredEmail(botId: string): string | null {
  try { return sessionStorage.getItem(sessionKey(botId)); } catch (_e) { return null; }
}
function storeEmail(botId: string, email: string) {
  try { sessionStorage.setItem(sessionKey(botId), email); } catch (_e) { /* SSR/private */ }
}
function clearEmail(botId: string) {
  try { sessionStorage.removeItem(sessionKey(botId)); } catch (_e) { /* SSR/private */ }
}

/* ─── Beautiful Login Form ──────────────────────────────────────────────────── */
function LoginForm({
  botId,
  agentName,
  brandColor,
  logoUrl,
  onSuccess,
}: {
  botId: string;
  agentName: string;
  brandColor: string;
  logoUrl?: string;
  onSuccess: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/chat/api/vegarag-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", bot_id: botId, email, password }),
      });

      if (res.ok) {
        storeEmail(botId, email);
        onSuccess(email);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Invalid email or password. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  const accentStyle = { backgroundColor: brandColor };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-200/80">
          
          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={accentStyle} />

          <div className="p-8">
            {/* Logo / brand */}
            <div className="flex flex-col items-center mb-8">
              {logoUrl ? (
                <img src={logoUrl} alt={agentName} className="h-14 w-14 rounded-2xl object-cover mb-4 shadow-md" />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                  style={accentStyle}
                >
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
              )}
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                {agentName}
              </h1>
              <p className="text-sm text-slate-500 mt-1 text-center font-medium">
                Sign in to start your conversation
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": brandColor } as any}
                  onFocus={e => e.target.style.boxShadow = `0 0 0 3px ${brandColor}22, 0 0 0 1px ${brandColor}`}
                  onBlur={e => e.target.style.boxShadow = ""}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                    onFocus={e => e.target.style.boxShadow = `0 0 0 3px ${brandColor}22, 0 0 0 1px ${brandColor}`}
                    onBlur={e => e.target.style.boxShadow = ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={accentStyle}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <p className="text-xs text-slate-400">
              Access is restricted to authorized users only.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── LoginGate main component ──────────────────────────────────────────────── */
export function LoginGate({
  botId,
  agentName,
  brandColor,
  logoUrl,
  children,
}: {
  botId: string;
  agentName: string;
  brandColor: string;
  logoUrl?: string;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<"checking" | "open" | "login" | "authed">("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!botId) { setStatus("open"); return; }

    // Check if bot has ANY users configured → requires login
    fetch(`/chat/api/vegarag-auth?bot_id=${encodeURIComponent(botId)}`)
      .then(r => r.json())
      .then((users: any[]) => {
        if (!Array.isArray(users) || users.length === 0) {
          // No users → open access
          setStatus("open");
          return;
        }
        // Bot has users — check for existing session
        const stored = getStoredEmail(botId);
        if (stored) {
          setUserEmail(stored);
          setStatus("authed");
        } else {
          setStatus("login");
        }
      })
      .catch(() => setStatus("open")); // On error, allow access to not break the chat
  }, [botId]);

  const handleLogout = () => {
    clearEmail(botId);
    fetch("/chat/api/vegarag-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", bot_id: botId }),
    }).catch(() => {});
    setUserEmail(null);
    setStatus("login");
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setStatus("authed");
  };

  // Still checking auth requirements
  if (status === "checking") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: brandColor || "#6366f1" }}
          />
          <p className="text-sm text-slate-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  // Login required
  if (status === "login") {
    return (
      <LoginForm
        botId={botId}
        agentName={agentName}
        brandColor={brandColor || "#6366f1"}
        logoUrl={logoUrl}
        onSuccess={handleLogin}
      />
    );
  }

  // Open access or authenticated — render children with auth context
  return (
    <AuthContext.Provider value={{ userEmail, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
