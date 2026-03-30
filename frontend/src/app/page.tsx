"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, Zap, Database, Layers, Bot, Github, Terminal } from "lucide-react";
import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";

export default function HomePage() {
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Use window.location as a fallback to ensure we don't hit Next.js 15 Router initialization errors during early redirection
    if (auth.isAuthenticated) {
      window.location.href = "/agents";
    }
  }, [auth.isAuthenticated]);

  if (!mounted || auth.isLoading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 selection:bg-blue-100">

      <MarketingNav />

      {/* ── Hero ── */}
      <main className="relative z-10">
        <section className="pt-20 pb-32 px-6 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Open-source · Self-host on AWS Fargate
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-slate-900 mb-8">
              The open-source engine<br />
              <span className="text-blue-600 underline decoration-blue-500 decoration-4 underline-offset-8 font-black tracking-tighter uppercase italic">for shipping AI agents.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-12">
              Deploy intelligent LLM agents instantly. Start for free on our managed cloud, or self-host natively in your own AWS account.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => auth.signinRedirect()}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white text-lg font-black rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" /> Start Building
              </button>
              <Link href="/deploy"
                className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 text-lg font-black rounded-2xl hover:border-slate-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Github className="w-5 h-5" /> Deploy Open Source
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-14 flex flex-wrap justify-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {["Amazon Bedrock Nova", "Pinecone Vectors", "LangGraph Agents", "DynamoDB", "AWS Fargate"].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {t}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── What it does (3 pillars, links to /features) ── */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
              One platform. Three superpowers.
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Connect any document or dataset — your agent knows what to do.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Database, color: "blue", title: "Knowledge RAG", desc: "Upload PDFs, websites, or raw text. Your agent retrieves exact answers from your documents using Amazon Bedrock + Pinecone.", label: "Vector search" },
              { icon: Zap, color: "purple", title: "SQL on Your Data", desc: "Upload CSV or Excel files and ask plain-English questions. LangGraph routes to DuckDB automatically — no SQL knowledge needed.", label: "Text-to-SQL" },
              { icon: Layers, color: "emerald", title: "Workflow Studio", desc: "Design multi-step agent workflows visually with a drag-and-drop canvas. Connect LLM nodes, API calls, and human handoffs.", label: "Visual builder" },
            ].map(({ icon: Icon, color, title, desc, label }) => (
              <Link key={title} href="/features"
                className={`group block bg-white rounded-3xl p-8 border border-slate-200 hover:border-${color}-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center mb-6 group-hover:bg-${color}-600 transition-colors duration-300`}>
                  <Icon className={`w-6 h-6 text-${color}-600 group-hover:text-white transition-colors duration-300`} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
                <span className={`text-[11px] font-black text-${color}-600 bg-${color}-50 px-2.5 py-1 rounded-full uppercase tracking-wider`}>{label}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/features"
              className="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all">
              See the full technical breakdown <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── Deployment Choice Section ── */}
        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-100">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Deploy exactly how you want.</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">Choose between zero-config managed hosting up to 250k free tokens, or own your data completely by deploying the open-source platform into your AWS account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-10 md:p-14 rounded-[2.5rem] border border-slate-200 hover:border-blue-300 transition-colors group">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4">The Free SaaS Trial</h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">Test your agents instantly without touching AWS. We provide Amazon Bedrock compute and Pinecone vector hosting free for up to <strong>250,000 tokens per month</strong> and 100MB of storage.</p>
              <div className="flex gap-4">
                <button onClick={() => auth.signinRedirect()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition w-full text-center">Start Free Trial</button>
              </div>
            </div>

            <div className="bg-slate-900 p-10 md:p-14 rounded-[2.5rem] text-white border border-slate-800 hover:border-slate-700 transition-colors group relative overflow-hidden">
              <div className="w-16 h-16 bg-slate-800 text-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Terminal className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4">Self-Host Open Source</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">Use our exhaustive GitHub deployment instructions to provision 100% of the infrastructure inside your own AWS VPC using strict ECS Fargate zero-key Task IAM boundaries.</p>
              <div className="flex gap-4 relative z-10">
                <Link href="/deploy" className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition w-full text-center border border-white/20">Read the Deploy Guide</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 opacity-20 blur-[100px] rounded-full" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Ready to deploy?</h2>
              <p className="text-slate-400 text-lg font-medium mb-10 max-w-xl mx-auto">
                Free forever. Self-host on AWS Fargate in under an hour.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => auth.signinRedirect()}
                  className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition shadow-xl">
                  Start Building Free
                </button>
                <Link href="/pricing"
                  className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition border border-white/10">
                  See Pricing →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-100 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2 font-bold text-slate-600">
              <Bot className="w-5 h-5 text-blue-600" /> VegaRAG
            </div>
            <p>© {new Date().getFullYear()} VegaRAG. Open-source AI agent platform.</p>
            <div className="flex gap-6 font-semibold">
              {[
                { label: "Features", href: "/features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Blog", href: "/blog" },
                { label: "GitHub", href: "https://github.com/challayashwanth1998-png/vega-rag" },
              ].map(l => (
                <Link key={l.label} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined}
                  className="hover:text-blue-600 transition">{l.label}</Link>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
