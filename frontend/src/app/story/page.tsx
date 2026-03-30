"use client";

import { MarketingNav } from "@/components/MarketingNav";
import { Globe, ShieldCheck, Zap, Bot, Database } from "lucide-react";
import { motion } from "framer-motion";

export default function StoryPage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      <MarketingNav />
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center mb-24 px-4"
        >
           <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase italic mb-8 scale-90 md:scale-100">Our Story.</h1>
           <p className="text-lg md:text-xl text-slate-500 font-bold leading-relaxed tracking-tight max-w-2xl mx-auto">
             Born from the frustration of building AI agents for high-security enterprise environments.
           </p>
        </motion.div>

        <article className="space-y-16 px-4">
           <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 italic uppercase tracking-tighter">The Problem.</h2>
              <p className="text-slate-600 font-semibold leading-loose text-base md:text-lg">
                While open-source LLM frameworks were abundant, we found most of them lacked the enterprise rigor needed for actual production. 
                They weren't serverless by default, they lacked multi-tenancy logic, and their deployment paths were often "demo-only".
              </p>
           </div>

           <div className="p-10 md:p-14 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition shrink-0 duration-700">
                <Globe className="w-40 h-40" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-8 italic uppercase tracking-tighter">The VegaRAG Vision.</h2>
              <p className="text-slate-400 font-bold leading-loose text-base md:text-lg relative z-10">
                We built VegaRAG to be the ultimate starting point for anyone building AI SaaS products. 
                By relying strictly on **Amazon Bedrock** (Zero-training architecture) and **AWS Fargate** (Serverless execution), 
                we ensure your agent's data is never used to train base models while costs remain predictable.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                 <ShieldCheck className="w-10 h-10 text-emerald-600 mb-6" />
                 <h3 className="text-xl font-black text-slate-900 mb-4 italic uppercase tracking-tighter">Private Data First.</h3>
                 <p className="text-slate-500 font-bold text-sm tracking-tight leading-relaxed">We never store your raw documents. They stay in your private S3 bucket, encrypted and secure.</p>
              </div>
              <div className="bg-indigo-50 p-10 rounded-[3rem] border border-indigo-100 shadow-sm">
                 <Zap className="w-10 h-10 text-indigo-600 mb-6" />
                 <h3 className="text-xl font-black text-slate-900 mb-4 italic uppercase tracking-tighter">Scale In Seconds.</h3>
                 <p className="text-slate-500 font-bold text-sm tracking-tight leading-relaxed">Our orchestration engine was designed for serverless architectures from day one.</p>
              </div>
           </div>
        </article>

        <section className="mt-32 pt-20 border-t border-slate-100 text-center px-4">
           <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-widest mb-10">Trusted By Innovators.</h2>
           <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale saturate-0 items-center">
              <div className="font-black text-4xl tracking-tighter italic">AURORA</div>
              <div className="font-bold text-2xl uppercase tracking-widest">GENESIS</div>
              <div className="font-extrabold text-3xl italic tracking-tight underline">LITHOS</div>
           </div>
        </section>
      </section>
    </div>
  );
}
