import type { Metadata } from "next";
import Link from "next/link";

import { Calendar } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "My Story | VegaRAG",
  description: "Why I built this open-source AI platform.",
};

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900">
      <MarketingNav />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> The Builder&apos;s Journey
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 underline decoration-blue-500 decoration-4 underline-offset-8 uppercase italic font-black tracking-tighter">
            Why I built <span className="text-blue-600">VegaRAG.</span>
          </h1>
        </header>

        {/* Founder Story */}
        <section className="flex justify-center">
          <div className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500 opacity-5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="space-y-6 text-xl text-slate-600 font-medium leading-relaxed mb-12 relative z-10">
              <p>
                I got completely sick of how &quot;no-code&quot; proprietary AI chatbot platforms were charging absurdly high, over-the-top subscription fees for basic vector RAG tools.
              </p>
              <p>
                As an AI Architect, I realized there was a massive gap for developers who needed absolute control over their data, their AWS infrastructure, and their vector pipelines without being constrained by an opaque SaaS billing tier.
              </p>
              <p>
                So I decided to build VegaRAG and open-source the entire LangGraph engine. My goal is to allow the developer community to collaborate, contribute, and grow together instead of being locked behind enterprise paywalls. 
              </p>
              <p>
                VegaRAG isn&apos;t just a wrapper—it&apos;s a fully capable multi-agent system built directly on top of AWS Fargate, LangGraph, and Pinecone, utilizing DuckDB for Text-to-SQL logic inside completely isolated namespaces. All of it zero-cost. All of it open-source.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 border-t border-slate-200 pt-10 relative z-10">
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-2xl mb-1">Challa Yashwanth</span>
                <span className="text-slate-500 font-bold tracking-tight">AI Engineer & Architect | Specialist in Multi-Agent RAG | Ex-HPE</span>
              </div>
              <div className="flex-1" />
              <div className="flex flex-col gap-4 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="https://www.linkedin.com/in/challa-yashwanth-06bb3813a/" target="_blank" rel="noopener noreferrer"
                    className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition flex-1 text-center shadow-md whitespace-nowrap">
                    LinkedIn
                  </a>
                  <a href="https://thechalla.vercel.app/" target="_blank" rel="noopener noreferrer"
                    className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition flex-1 text-center shadow-md whitespace-nowrap">
                    Portfolio
                  </a>
                </div>
                <a href="https://calendly.com/challa-yashwanth1998/30min" target="_blank" rel="noopener noreferrer"
                  className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition w-full text-center shadow-md flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-200" /> Book a meeting with me
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-100 py-12 px-6 bg-slate-50 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} VegaRAG Open Source</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-blue-600 transition">Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
