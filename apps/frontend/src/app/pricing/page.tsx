import type { Metadata } from "next";
import Link from "next/link";
import { Bot, CheckCircle2, Github, ArrowRight, Zap, Shield, Users, Server, Database } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "Pricing | VegaRAG — Free Open-Source AI Agent Platform",
  description: "VegaRAG is 100% open-source and free to self-host. No vendor lock-in, no per-user pricing.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900">
      <MarketingNav />

      <main className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <header className="py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Try before you build
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 flex flex-col items-center justify-center gap-2">
            <span className="underline decoration-blue-500 decoration-4 underline-offset-8 font-black tracking-tighter uppercase italic">Free to test.</span> <span className="underline decoration-emerald-500 decoration-4 underline-offset-8 font-black tracking-tighter uppercase italic">Free to own.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-3xl mx-auto">
            Test and iterate on your AI chatbots instantly on our free managed infrastructure. Once you&apos;ve proved the value, deploy the open-source code to your own AWS VPC.
          </p>
        </header>

        {/* Pricing Cards */}
        <section className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* SaaS Trial Card */}
            <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-10 flex flex-col hover:border-blue-400 transition-colors relative overflow-hidden group shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Managed Trial</h3>
              </div>
              <p className="text-slate-500 mb-8 max-w-xs">Instantly build and test your agents over our hosted infrastructure.</p>
              
              <div className="text-5xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-8">
                $0<span className="text-xl text-slate-400 font-medium tracking-normal">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-slate-600 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Up to 250,000 requests/mo
                </li>
                <li className="flex items-start gap-3 text-slate-600 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> 100MB Vector Storage
                </li>
                <li className="flex items-start gap-3 text-slate-600 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Zero configuration required
                </li>
                <li className="flex items-start gap-3 text-slate-600 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Instant Next.js dashboard access
                </li>
              </ul>
              
              <Link href="/login"
                className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
                Start Building Free
              </Link>
            </div>

            {/* Open Source Card */}
            <div className="bg-slate-900 text-white border-2 border-slate-800 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden shadow-2xl group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-20 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black">Self-Host (OSS)</h3>
              </div>
              <p className="text-slate-400 mb-8 max-w-xs relative z-10">Own the code. Maintain absolute privacy by deploying to your own AWS.</p>
              
              <div className="text-5xl font-black text-white mb-8 border-b border-slate-800 pb-8 relative z-10">
                $0<span className="text-xl text-slate-500 font-medium tracking-normal"> forever</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1 relative z-10">
                <li className="flex items-start gap-3 text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Unlimited Agents & Requests
                </li>
                <li className="flex items-start gap-3 text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Total Data Privacy (Your VPC)
                </li>
                <li className="flex items-start gap-3 text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Extensible Python backend
                </li>
                <li className="flex items-start gap-3 text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> 100% MIT Licensed Codebase
                </li>
              </ul>
              
              <a href="https://github.com/challayashwanth1998-png/vega-rag" target="_blank" rel="noopener noreferrer"
                className="w-full px-8 py-4 bg-white text-slate-900 text-lg font-bold rounded-2xl hover:bg-slate-100 transition flex items-center justify-center gap-2 relative z-10">
                <Github className="w-5 h-5" /> Get the Code
              </a>
            </div>

          </div>
        </section>

        {/* AWS Infrastructure Cost Breakdown */}
        <section className="py-16 border-t border-slate-100/10 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-4 underline decoration-blue-500 decoration-4 underline-offset-8 uppercase italic font-black tracking-tighter">
              Real AWS Running Costs
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
              While VegaRAG itself is free, hosting it on AWS does incur infrastructure costs. Here&apos;s what you can expect to pay Amazon directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Fargate + ALB</h3>
                  <p className="text-slate-500 text-sm font-medium">Compute Overhead</p>
                </div>
              </div>
              <p className="font-semibold text-slate-700">~ $25 to $40 / month</p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Runs the Next.js React frontend and the FastAPI Python backend asynchronously on serverless containers via an Application Load Balancer.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Pinecone Serverless</h3>
                  <p className="text-slate-500 text-sm font-medium">Vector Database</p>
                </div>
              </div>
              <p className="font-semibold text-slate-700">Pay per Read/Write usage</p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Pinecone offers $100 in free serverless credits. Extremely cost-effective for multi-tenant setups via namespace isolation compared to indexed endpoints.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Bedrock Nova</h3>
                  <p className="text-slate-500 text-sm font-medium">Token Generation</p>
                </div>
              </div>
              <p className="font-semibold text-slate-700">$0.035 per 1M Output Tokens</p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Amazon Nova Micro is ridiculously cheap. You will likely pay pennies per month for all your RAG streaming needs.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">S3 & DynamoDB</h3>
                  <p className="text-slate-500 text-sm font-medium">Core Storage</p>
                </div>
              </div>
              <p className="font-semibold text-slate-700">Practically free under Free Tier</p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Stores uploaded PDFs, Excel sheets, and fast metadata for user bots. Usually remains entirely within the AWS Free Tier limitations.</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-100 py-12 px-6 mt-16 bg-slate-50">
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
