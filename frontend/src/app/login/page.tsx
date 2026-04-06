"use client";

import React, { useState } from "react";
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, Bot } from "lucide-react";
import Link from "next/link";

type Mode = "login" | "signup" | "confirm" | "forgot_password" | "forgot_password_confirm";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { refreshAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        await refreshAuth();
        router.push("/agents");
      }
    } catch (err: any) {
      if (err.name === "UserNotConfirmedException") {
        setMode("confirm");
      } else {
        setError(err.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setMode("confirm");
      } else if (isSignUpComplete) {
        await handleLogin(e);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const reqs = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least 1 uppercase letter", met: /[A-Z]/.test(password) },
    { label: "At least 1 lowercase letter", met: /[a-z]/.test(password) },
    { label: "At least 1 number", met: /[0-9]/.test(password) },
    { label: "At least 1 special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email first");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword({ username: email });
      setMode("forgot_password_confirm");
    } catch (err: any) {
      setError(err.message || "Failed to initiate password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword: password });
      setMode("login");
      setError(null);
      setPassword("");
      setConfirmPassword("");
      setCode("");
      alert("Password has been reset successfully. Please login.");
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { isSignUpComplete } = await confirmSignUp({ username: email, confirmationCode: code });
      if (isSignUpComplete) {
        // Automatically login after confirm
        await signIn({ username: email, password });
        await refreshAuth();
        router.push("/agents");
      }
    } catch (err: any) {
      setError(err.message || "Invalid confirmation code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[radial-gradient(#64748b45_1.5px,transparent_1.5px)] [background-size:28px_28px]">
      
      {/* Brand & Nav */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-800 text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <Bot className="text-white w-5 h-5" />
          </div>
          VegaRAG
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 rounded-3xl p-8 sm:p-10 relative z-10"
      >
        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Welcome back</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">Enter your credentials to access your agents.</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">{error}</div>}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">Email</label>
                  <input
                    id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                     <label className="block text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                     <button type="button" onClick={() => { setError(null); setMode("forgot_password"); }} className="text-sm text-blue-600 font-bold hover:underline">Forgot?</button>
                  </div>
                  <input
                    id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
                </button>
              </form>
              <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                Don't have an account? <button onClick={() => { setError(null); setMode("signup"); }} className="text-blue-600 font-bold hover:underline">Sign up</button>
              </div>
            </motion.div>
          )}

          {mode === "signup" && (
            <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Create an account</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">Start building your AI agents in seconds.</p>
              
              <form onSubmit={handleSignup} className="space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">{error}</div>}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="name-up">Full Name</label>
                  <input
                    id="name-up" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email-up">Email</label>
                  <input
                    id="email-up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password-up">Password</label>
                  <input
                    id="password-up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Password"
                  />
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {reqs.map((r, i) => (
                      <div key={i} className={`flex items-center gap-1.5 ${r.met ? "text-emerald-600" : "text-slate-500"}`}>
                        {r.met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="confirm-up">Confirm Password</label>
                  <input
                    id="confirm-up" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Must match password"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full mt-2 py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xl shadow-black/10 transition-all flex justify-center items-center disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </button>
              </form>
              <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                Already have an account? <button onClick={() => { setError(null); setMode("login"); }} className="text-blue-600 font-bold hover:underline">Sign in</button>
              </div>
            </motion.div>
          )}

          {mode === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">We sent a verification code to <strong className="text-slate-700">{email}</strong>.</p>
              
              <form onSubmit={handleConfirm} className="space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">{error}</div>}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="code">Verification Code</label>
                  <input
                    id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-center tracking-widest text-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold"
                    placeholder="000000"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                Wrong email? <button onClick={() => { setError(null); setMode("signup"); }} className="text-blue-600 font-bold hover:underline">Start over</button>
              </div>
            </motion.div>
          )}

          {mode === "forgot_password" && (
            <motion.div key="forgot_password" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Reset Password</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">Enter your email and we'll send you a recovery code.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">{error}</div>}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="you@company.com"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                Remember your password? <button onClick={() => { setError(null); setMode("login"); }} className="text-blue-600 font-bold hover:underline">Sign in</button>
              </div>
            </motion.div>
          )}

          {mode === "forgot_password_confirm" && (
            <motion.div key="forgot_password_confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Set New Password</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">Enter the code sent to your email and your new password.</p>
              
              <form onSubmit={handleConfirmForgotPassword} className="space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">{error}</div>}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="reset-code">Recovery Code</label>
                  <input
                    id="reset-code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-center tracking-widest text-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold"
                    placeholder="000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="reset-password">New Password</label>
                  <input
                    id="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="New password"
                  />
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {reqs.map((r, i) => (
                      <div key={i} className={`flex items-center gap-1.5 ${r.met ? "text-emerald-600" : "text-slate-500"}`}>
                        {r.met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="reset-confirm">Confirm New Password</label>
                  <input
                    id="reset-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Must match new password"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reset Password <CheckCircle2 className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                Changed your mind? <button onClick={() => { setError(null); setMode("login"); }} className="text-blue-600 font-bold hover:underline">Back to Login</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
