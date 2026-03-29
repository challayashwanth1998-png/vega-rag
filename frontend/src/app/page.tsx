"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, ArrowRight, ShieldCheck, Zap, Database, Globe, Code2, CheckCircle2, Loader2, Heart, Coffee, MousePointer2, Smartphone, Terminal, Sparkles, Github, Lock, Unlock } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (auth.isAuthenticated) {
      router.push('/agents');
    }
  }, [auth.isAuthenticated, router]);

  if (!mounted) return null;

  if (auth.isLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  const handleAuthAction = () => {
    if (auth.isAuthenticated) {
      router.push('/agents');
    } else {
      auth.signinRedirect();
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Precision Dot Net Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80" style={{ backgroundImage: "radial-gradient(#94a3b8 2px, transparent 2px)", backgroundSize: "36px 36px" }} />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-white/10 via-white/80 to-white" />

      {/* Top Navbar */}
      <nav className="relative z-50 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-extrabold tracking-tight text-slate-900">VegaRAG</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 tracking-wide">
          <a href="#features" className="hover:text-blue-600 transition">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition">How it Works</a>
          <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
          <a href="https://github.com/challayashwanth1998-png/vega-rag" target="_blank" className="hover:text-blue-600 flex items-center gap-1.5 transition text-slate-900">
             <Github className="w-4 h-4" /> Open Source
          </a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleAuthAction} className="px-5 py-2.5 text-slate-700 font-bold text-sm hover:text-blue-600 transition">
            {auth.isAuthenticated ? 'Dashboard' : 'Log In'}
          </button>
          <button onClick={handleAuthAction} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition">
            {auth.isAuthenticated ? 'Open Workspace' : 'Build your Agent'}
          </button>
        </div>
      </nav>

      <main className="relative z-10 w-full flex flex-col items-center overflow-hidden">
        
        {/* HERO SECTION */}
        <section className="pt-24 pb-32 px-6 max-w-5xl mx-auto text-center font-sans tracking-tight">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5}}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-8">
                 <Unlock className="w-4 h-4 text-emerald-600" /> 100% Free & Open Source Codebase
              </div>
              <h1 className="text-5xl md:text-8xl font-black mb-8 text-slate-900 leading-[0.95] tracking-tighter">
                Create AI Chatbots<br/><span className="text-blue-600">for your website.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
                Empower your website with context-aware AI agents in seconds. Connect your documentation and deploy a trained Bedrock Nova chatbot instantly. <strong>No hidden fees, no gatekeeping.</strong>
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-50">
                <button onClick={handleAuthAction} className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition hover:-translate-y-1">
                  {auth.isAuthenticated ? 'Open Dashboard' : 'Deploy Agent'} <ArrowRight className="w-5 h-5" />
                </button>
                <a href="https://github.com/challayashwanth1998-png/vega-rag" target="_blank" className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 rounded-2xl font-black text-xl shadow-sm flex items-center justify-center gap-3 transition">
                  <Github className="w-6 h-6" /> Clone the Source
                </a>
              </div>
              <div className="mt-12 flex justify-center items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> MIT License</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Full SaaS Stack</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Community Driven</div>
              </div>
          </motion.div>
        </section>

        {/* OPEN SOURCE PROOF SECTION */}
        <section className="py-20 px-6 w-full max-w-6xl mx-auto text-center">
            <div className="bg-slate-50 rounded-[4rem] p-12 md:p-20 border border-slate-200 shadow-inner group">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 italic tracking-tight">Access the entire Engine.</h2>
                <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto mb-12">
                    VegaRAG is not a black box. We provide the full source code for our multi-tenant SaaS architecture, including the Bedrock Nova integration and Pinecone retrieval logic.
                </p>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 text-left">
                        <Terminal className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="font-black text-slate-900 text-sm italic">Backend: FastAPI & LangGraph</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">100% Public Code</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 text-left">
                        <Smartphone className="w-8 h-8 text-emerald-600" />
                        <div>
                            <p className="font-black text-slate-900 text-sm italic">Frontend: Next.js & Tailwind</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">100% Public UI</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-32 px-6 w-full bg-white border-y border-slate-100 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 underline decoration-blue-600 decoration-8 underline-offset-8 italic">Transparent RAG.</h2>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mt-10">Our open source agents use real-time retrieval to answer strictly from your provided facts, powered by Amazon's Bedrock Nova infrastructure.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition duration-500 group">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition duration-500">
                   <Database className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-4">Open Vector Pipeline</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Clone our orchestration code that chunks, vectorizes, and indexes your data into serverless Pinecone environments automatically.</p>
              </div>
              <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition duration-500 group">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-8 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition duration-500">
                   <Zap className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-4">Nova Micro Speed</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Powered by the latest <strong>Amazon Nova Micro</strong> v1.0. Lower latency for your users and lower token burn for your wallet.</p>
              </div>
              <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition duration-500 group">
                 <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-[1.5rem] flex items-center justify-center mb-8 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition duration-500">
                   <Globe className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-4">Open Widget Code</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">We maintain an open-source widget project so you can customize every pixel of the chatbot interface on your own site.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-32 px-6 w-full max-w-4xl mx-auto text-center">
           <div className="bg-slate-900 text-white p-12 md:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 opacity-20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500 opacity-20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
              
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 relative z-10 italic">Free for the Community.</h2>
              <p className="text-xl text-slate-400 font-medium mb-16 max-w-2xl mx-auto relative z-10 leading-relaxed">
                VegaRAG is a public engineering project. Download the entire multi-tenant SaaS stack from GitHub and launch your own platform today.
              </p>
              
              <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-[3rem] p-10 md:p-14 max-w-lg mx-auto text-left relative z-10 shadow-xl mb-12">
                 <div className="flex justify-between items-center border-b border-slate-700/50 pb-8 mb-8">
                    <div>
                        <h3 className="text-3xl font-black">Open Sourced</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1 italic">MIT Open License</p>
                    </div>
                    <span className="text-blue-400 font-black text-5xl tracking-tighter">$0</span>
                 </div>
                 <ul className="space-y-5 mb-12">
                   <li className="flex items-center gap-4 font-bold text-slate-300"><CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> Full Source Code Access</li>
                   <li className="flex items-center gap-4 font-bold text-slate-300"><CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> Multi-Tenant Architecture</li>
                   <li className="flex items-center gap-4 font-bold text-slate-300"><CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> Serverless Cloud Blueprints</li>
                   <li className="flex items-center gap-4 font-bold text-slate-300"><CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> Open Integration Framework</li>
                 </ul>
                 <a href="https://github.com/challayashwanth1998-png/vega-rag" target="_blank" className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xl hover:bg-slate-100 transition shadow-lg flex items-center justify-center gap-3">
                   Clone from GitHub <Github className="w-6 h-6" />
                 </a>
                 <div className="mt-8 pt-8 border-t border-slate-700/50 flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Public Project</p>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-black uppercase">Production Ready</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full py-20 border-t border-slate-200 text-center text-slate-500 font-medium bg-white relative z-10 flex flex-col items-center gap-6">
          <Bot className="w-12 h-12 text-blue-100" />
          <div className="flex gap-10 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              <Link href="/blog" className="hover:text-blue-600 transition">Blog / News</Link>
              <a href="https://github.com/challayashwanth1998-png/vega-rag" className="hover:text-blue-600 transition">Source Code</a>
              <a href="#" className="hover:text-blue-600 transition">Twitter / X</a>
              <Link href="/agents" className="hover:text-blue-600 transition">Dashboard</Link>
          </div>
          <p className="text-slate-400">&copy; {new Date().getFullYear()} VegaRAG Engine. Open Source Multi-Tenant AI Platform Codebase.</p>
        </footer>

      </main>
    </div>
  );
}
