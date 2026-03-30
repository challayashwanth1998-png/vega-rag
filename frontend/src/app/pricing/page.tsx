"use client";

import { MarketingNav } from "@/components/MarketingNav";
import { Check, Zap, Bot, Globe, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      <MarketingNav />
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase italic mb-6">Simple, Fair Pricing.</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest">Built for startups and growing enterprises.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Starter", price: "$0", desc: "For individual developers.", features: ["3 AI Agents", "250,000 Tokens/mo", "Shared Pinecone Index", "Community Support"], color: "bg-slate-50 text-slate-900 border-none" },
            { name: "Pro", price: "$49", desc: "For growing SaaS teams.", features: ["Unlimited AI Agents", "5,000,000 Tokens/mo", "Dedicated Vector Namespace", "Priority Email Support", "Custom Brand Colors"], color: "bg-slate-900 text-white shadow-2xl scale-105 border-none", popular: true },
            { name: "Enterprise", price: "Custom", desc: "For scale and security.", features: ["Unlimited Everything", "Custom Service Level Agreements", "Dedicated VPC Deployment", "White-label Dashboard"], color: "bg-indigo-600 text-white border-none" }
          ].map((tier, i) => (
            <motion.div 
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-10 rounded-[3rem] flex flex-col relative overflow-hidden ${tier.color}`}
            >
              {tier.popular && <div className="absolute top-8 right-8 px-4 py-1.5 bg-blue-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Most Popular</div>}
              <div className="mb-12">
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-4">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                  <span className="text-sm font-bold opacity-60">/month</span>
                </div>
                <p className="mt-4 text-xs font-bold opacity-60 uppercase tracking-widest">{tier.desc}</p>
              </div>

              <div className="flex-1 space-y-6 mb-12">
                {tier.features.map(feat => (
                  <div key={feat} className="flex items-center gap-3">
                    <Check className={`w-5 h-5 ${tier.name === 'Starter' ? 'text-blue-600' : 'text-white/40'}`} />
                    <span className="text-sm font-bold tracking-tight">{feat}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition shadow-xl ${tier.name === 'Starter' ? 'bg-slate-900 text-white hover:bg-blue-600' : 'bg-white text-slate-900 hover:shadow-2xl'}`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
