"use client";

import { MarketingNav } from "@/components/MarketingNav";
import { ArrowRight, Bot, Zap, Database, Search, MessageSquare, Globe, ArrowDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-700">
      <MarketingNav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-full blur-3xl -z-10 opacity-60" />
        
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-100 shadow-sm shadow-blue-500/10">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              Next-Gen AI Orchestration
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] italic uppercase">
              Build AI Agents <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">That Actually Work.</span>
            </h1>
            
            <p className="mt-8 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-bold tracking-tight leading-relaxed px-4">
              Enterprise-grade RAG platform for Amazon Bedrock. Deploy multi-tenant, secure, and production-ready assistants in minutes, not months.
            </p>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4 px-6 scale-95 md:scale-100">
              <Link 
                href="/agents" 
                className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-2xl flex items-center justify-center gap-3 group"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-300" />
              </Link>
              <Link 
                href="/pricing" 
                className="w-full md:w-auto px-10 py-5 bg-white border-2 border-slate-100 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 shadow-xl transition flex items-center justify-center gap-3"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">Infrastructure for Tomorrow.</h2>
            <p className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-widest">Built strictly with AWS Fargate and Pinecone.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Fargate Serverless", desc: "Scale instantly without managing EC2 instances. Low cost, high speed execution.", color: "bg-orange-500" },
              { icon: Database, title: "Vector Persistence", desc: "Native Pinecone integration for sub-second retrieval from millions of documents.", color: "bg-blue-600" },
              { icon: Globe, title: "Multi-Tenant API", desc: "Secure segregation for enterprise users via Cognito and private VPC architectures.", color: "bg-emerald-600" },
              { icon: Search, title: "Smart Retrieval", desc: "Advanced hybrid search logic powered by Amazon Titan and expert embedding pipelines.", color: "bg-purple-600" },
              { icon: MessageSquare, title: "Embedded Widget", desc: "A customizable JS widget for any website that inherits your brand identity.", color: "bg-rose-600" },
              { icon: LayoutGrid, title: "Admin Portal", desc: "A sleek analytics dashboard to monitor LLM expenditure and user activity logs.", color: "bg-slate-900" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition duration-500 group"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition duration-500`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4 italic uppercase tracking-tighter">{feature.title}</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 italic">VegaRAG</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">&copy; 2026 Vega Enterprise Labs. All Rights Reserved.</p>
          </div>

          <div className="flex items-center gap-8">
            {["Terms", "Privacy", "GitHub", "X"].map(link => (
              <a key={link} href="#" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition uppercase tracking-widest">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
