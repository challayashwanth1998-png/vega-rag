"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, ArrowRight, ShieldCheck, Zap, Database, Globe, Code2, CheckCircle2, Loader2, Heart, Coffee } from "lucide-react";

export default function LandingPage() {
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  // Marketing Landing Page (Light Mode)
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative">
      {/* 
         The precise dot net grid requested by User.
         Identical to the uploaded file visually but scales infinitely. 
      */}
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
          <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
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
        <section className="pt-24 pb-32 px-6 max-w-5xl mx-auto text-center">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5}}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest mb-8 shadow-sm">
                 <Code2 className="w-4 h-4 text-blue-600" /> Built by developers, for developers
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 leading-[1.1]">
                Custom AI for your website<br/>in seconds.
              </h1>
              <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                VegaRAG connects Amazon Bedrock to your private data. Train an AI agent on your documentation and embed it natively on your website.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={handleAuthAction} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition hover:-translate-y-1">
                  {auth.isAuthenticated ? 'Open Dashboard' : 'Start Building'} <ArrowRight className="w-5 h-5" />
                </button>
                <button className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 rounded-2xl font-bold text-lg shadow-sm flex items-center justify-center transition">
                  View Documentation
                </button>
              </div>
              <p className="mt-6 text-sm font-semibold text-slate-500 flex justify-center items-center gap-1.5 object-center"><ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Free Forever. No credit card required.</p>
          </motion.div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 px-6 w-full bg-slate-50/80 border-y border-slate-200 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Everything you need to deploy AI.</h2>
              <p className="text-lg text-slate-500 font-medium">Enterprise-grade architecture compiled into a dangerously simple User Interface.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition duration-300">
                 <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                   <Database className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Serverless Vector DB</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Seamlessly embedded Pinecone infrastructure. We automatically chunk, vectorize, and index your URLs and text files instantly.</p>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition duration-300">
                 <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                   <Zap className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Amazon Nova Bedrock</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Ultra-low latency streaming inference powered strictly by Amazon's cutting-edge Nova Micro model architecture underneath.</p>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition duration-300">
                 <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 border border-purple-100">
                   <Globe className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Omnichannel Widget</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Drop a single line of Javascript snippet into WordPress, Shopify, or React. The intelligent widget fully maps to your brand colors automatically.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-32 px-6 w-full max-w-4xl mx-auto text-center">
           <div className="bg-slate-900 text-white p-12 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 opacity-20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
              
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 relative z-10">100% Free for Everyone.</h2>
              <p className="text-lg text-slate-400 font-medium mb-12 max-w-xl mx-auto relative z-10">
                We built VegaRAG because developers shouldn't have to pay $99/mo to wrap a standard Vector Database over an LLM mapping.
              </p>
              
              <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-[2rem] p-8 md:p-10 max-w-lg mx-auto text-left relative z-10 shadow-xl mb-12">
                 <h3 className="text-2xl font-bold mb-6 flex items-center justify-between border-b border-slate-700/50 pb-6">
                    Developer Tier <span className="text-blue-400 font-extrabold text-3xl">$0</span>
                 </h3>
                 <ul className="space-y-4 mb-8">
                   <li className="flex items-center gap-3 font-medium text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Unlimited AI Agents</li>
                   <li className="flex items-center gap-3 font-medium text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> 250,000 Generative Tokens / month</li>
                   <li className="flex items-center gap-3 font-medium text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Unlimited Pinecone Ingestion</li>
                   <li className="flex items-center gap-3 font-medium text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Embedded Web Widget Code</li>
                 </ul>
                 <button onClick={handleAuthAction} className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-100 transition shadow-lg flex items-center justify-center gap-2">
                   {auth.isAuthenticated ? 'Enter Workspace' : 'Start Building for Free'} <ArrowRight className="w-5 h-5" />
                 </button>
                 <p className="text-center text-xs text-slate-500 mt-4 font-medium uppercase tracking-widest">No Paid Plans Available</p>
              </div>

              <div className="max-w-2xl mx-auto relative z-10 p-8 md:p-10 border border-white/10 bg-white/5 rounded-[2rem] backdrop-blur-sm">
                 <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8 text-rose-500" />
                 </div>
                 <h3 className="text-2xl font-bold mb-3">Help Keep VegaRAG Free</h3>
                 <p className="text-slate-400 font-medium leading-relaxed mb-8">
                    Running world-class AI models natively atop scalable Vector infrastructure is expensive. Because we fundamentally reject paid gatekeeping, we rely entirely on community funding to keep the servers alive. 100% of donations go directly to AWS core architecture bills.
                 </p>
                 <button className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 mx-auto shadow-xl shadow-rose-500/20 hover:-translate-y-1">
                    <Coffee className="w-5 h-5" /> Fund the Infrastructure
                 </button>
              </div>
           </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full py-10 border-t border-slate-200 text-center text-slate-500 font-medium bg-white relative z-10 flex flex-col items-center gap-4">
          <Bot className="w-8 h-8 text-blue-200" />
          <p>&copy; {new Date().getFullYear()} VegaRAG Engine. Built by Developers, for Developers.</p>
        </footer>

      </main>
    </div>
  );
}
