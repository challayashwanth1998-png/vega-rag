"use client";

import { motion } from "framer-motion";
import { BarChart3, Zap, Brain, Activity, ArrowUpRight, TrendingUp } from "lucide-react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/components/Providers";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsagePage() {
  const auth = useAuth();
  const user_email = auth.user?.profile?.email || auth.user?.profile?.sub || "private_user";

  const { data: agents, isLoading } = useSWR(
    user_email ? `${api.baseUrl}/api/agents?user_email=${encodeURIComponent(user_email)}` : null,
    fetcher
  );

  const activeAgentsCount = agents?.length || 0;

  // Fetch analytics for every agent in parallel to get real token counts
  const agentIds: string[] = (agents ?? []).map((a: any) => a.bot_id);
  const { data: rawAnalytics } = useSWR(
    agentIds.length > 0 ? `analytics-all-${agentIds.join(",")}` : null,
    () =>
      Promise.all(
        agentIds.map((id) =>
          fetch(`${api.baseUrl}/api/agents/${id}/analytics`).then((r) => r.json())
        )
      ),
    { revalidateOnFocus: true }
  );

  // Zip agents + analytics results — both arrays are parallel-indexed
  const agentTokens = (agents ?? []).map((a: any, i: number) => {
    const days: any[] = (rawAnalytics ?? [])[i] ?? [];
    const tokens = days.reduce((s: number, d: any) => s + (d.tokens ?? 0), 0);
    const queries = days.reduce((s: number, d: any) => s + (d.queries ?? 0), 0);
    return { name: a.name, id: a.bot_id, tokens, queries };
  });

  const totalTokensUsed = agentTokens.reduce((sum: number, a: any) => sum + a.tokens, 0);
  const tokenLimit = 250000;
  const usagePercent = Math.min(100, Math.round((totalTokensUsed / tokenLimit) * 100));

  const stats = [
    { name: "Total Account Tokens", value: totalTokensUsed.toLocaleString(), icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "My Active Agents", value: activeAgentsCount.toString(), icon: Brain, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Quota Status", value: usagePercent < 80 ? "Healthy" : "Check Limit", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 selection:bg-blue-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8 mb-2">Account Analytics</h1>
          <p className="text-slate-500 font-medium tracking-tight">Real-time resource utilization for <span className="text-blue-600 font-bold">{user_email}</span></p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl hover:bg-blue-600 transition-colors cursor-pointer">
            <TrendingUp className="w-4 h-4" /> Download Statement
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-10 bg-white border-2 border-slate-50 rounded-[3rem] shadow-xl"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.name}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Workspace Allocation */}
      <div className="p-12 bg-slate-900 rounded-[4rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 opacity-[0.05] pointer-events-none transition-transform group-hover:scale-110 duration-1000"><Zap className="w-80 h-80 text-white" /></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex justify-between items-end mb-10 text-white">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-400">Total Usage Quota</h2>
              <p className="text-sm text-slate-400 font-medium tracking-tight">Cumulative tokens consumed by all agents on this account.</p>
            </div>
            <div className="text-right">
              <span className="text-5xl font-black text-white italic tracking-tighter">{usagePercent}%</span>
            </div>
          </div>

          <div className="w-full h-10 bg-white/5 rounded-[1.5rem] overflow-hidden p-1.5 shadow-inner border border-white/5">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${usagePercent}%` }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-lg relative"
             >
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
             </motion.div>
          </div>

          <div className="mt-8 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic font-bold">
             <span>Used: {totalTokensUsed.toLocaleString()} Tokens</span>
             <span>Limit: {tokenLimit.toLocaleString()} Tokens</span>
          </div>
        </div>
      </div>

      {/* Per-Agent Table */}
      <div className="bg-white border-2 border-slate-50 rounded-[3rem] shadow-xl p-10 overflow-hidden">
        <div className="flex items-center justify-between mb-10 px-4">
           <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Usage by Independent Agent</h3>
           <span className="text-[10px] font-black text-white bg-blue-600 px-4 py-1.5 rounded-full uppercase tracking-widest leading-none flex items-center gap-2">
             <Activity className="w-3 h-3" /> Live Metrics
           </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-[0.2em]">Agent Entity</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-[0.2em]">Status</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right tracking-[0.2em]">Activity Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agentTokens.map((agent: any) => (
                <tr key={agent.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-slate-100 text-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-all rounded-xl flex items-center justify-center font-black italic tracking-tighter">
                        {agent.name.charAt(0)}
                      </div>
                      <span className="font-black text-slate-900 tracking-tight italic text-lg group-hover:text-blue-600 transition-colors uppercase">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                     <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">Optimized</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className="font-black text-slate-900 italic tracking-tighter text-2xl group-hover:text-blue-600 transition-colors">{agent.tokens.toLocaleString()}</span>
                    <span className="text-[10px] font-black text-slate-400 ml-2 tracking-widest">TOKENS</span>
                  </td>
                </tr>
              ))}
              {agentTokens.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-10 py-20 text-center text-slate-400 font-bold uppercase italic tracking-widest text-xs">
                    Initialization pending — create an agent to see metrics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
