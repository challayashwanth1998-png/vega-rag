"use client";

import { ChatBox } from "@/components/ChatBox";
import { Settings2, SlidersHorizontal, ShieldCheck, HeartHandshake, Briefcase, Code, Loader2 } from "lucide-react";
import { use, useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const PRESETS = [
  { id: "support", icon: HeartHandshake, name: "Customer Service", desc: "Friendly, polite, redirects to support.", prompt: "You are a warm, polite Customer Success Agent. Always use the retrieved context to answer. If you cannot find the answer in the context, do NOT make one up. Instead, politely apologize and tell the user to email support@company.com for further assistance." },
  { id: "sales", icon: Briefcase, name: "SaaS Sales AI", desc: "Aggressive lead generation focus.", prompt: "You are a highly persuasive SaaS Sales Engineer. Answer questions briefly using the context. No matter what the user asks, constantly pivot the conversation and strongly encourage the user to provide their email address to book a real demo with the human sales team." },
  { id: "tech", icon: Code, name: "API Docs strict", desc: "Monotone, analytical, code-only.", prompt: "You are a dry, robotic documentation engine. Output only code snippets or JSON when possible. Never apologize. Do not use conversational filler. Use the context strictly. If no context is found, state '404_KNOWLEDGE_NOT_FOUND'." }
];

export default function PlaygroundPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  // Real-time polling to unlock ChatBox
  const { data: sources } = useSWR(`http://localhost:8000/api/agents/${botId}/sources`, fetcher, { refreshInterval: 5000 });
  const { data: config, mutate: mutateConfig } = useSWR(`http://localhost:8000/api/agents/${botId}/config`, fetcher);

  const [promptInput, setPromptInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync DB config to text box initially
  useEffect(() => {
     if (config?.system_prompt && !promptInput) setPromptInput(config.system_prompt);
  }, [config]);

  const handleSave = async () => {
    if (!promptInput.trim()) return;
    setIsSaving(true);
    try {
      await fetch(`http://localhost:8000/api/agents/${botId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           system_prompt: promptInput,
           brand_color: config?.brand_color || "#2563eb",
           name: config?.name || "Agent"
        })
      });
      mutateConfig();
    } catch(e) {}
    setIsSaving(false);
  };

  return (
    <div className="flex h-full p-8 gap-8 bg-slate-100/50 overflow-hidden">
      
      {/* Configuration Panel */}
      <div className="w-[500px] bg-white/80 backdrop-blur-xl rounded-[2rem] border border-blue-100 shadow-[0_20px_50px_rgba(59,130,246,0.05)] flex flex-col shrink-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100"><SlidersHorizontal className="w-5 h-5" /></div>
             <h2 className="text-xl font-bold text-slate-800 tracking-tight">Guardrails</h2>
          </div>
          <button disabled={isSaving || !promptInput || promptInput === config?.system_prompt} onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition disabled:opacity-50 shadow-sm flex items-center justify-center min-w-[80px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save Profile"}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Persona Presets</label>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Instantly force your Amazon Nova Micro LLM into specific behavioral guardrails by clicking a template below.</p>
            <div className="space-y-3">
               {PRESETS.map(p => (
                 <button 
                   key={p.id} 
                   onClick={() => setPromptInput(p.prompt)}
                   className="w-full flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl transition text-left group"
                 >
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 group-hover:text-blue-600 transition"><p.icon className="w-5 h-5"/></div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition">{p.name}</h4>
                      <p className="text-xs font-medium text-slate-500">{p.desc}</p>
                    </div>
                 </button>
               ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Settings2 className="w-4 h-4"/> Custom System Prompt</label>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">Or manually engineer the exact boundary instructions injected natively into the Bedrock layer.</p>
            <textarea 
              rows={8} 
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="You are a helpful AI..."
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none text-sm font-medium text-slate-700 resize-none transition-all shadow-inner leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Right Chat Sandbox Panel */}
      <div className="flex-1 min-w-[500px]">
         <ChatBox botId={botId} hasSources={sources && sources.length > 0} />
      </div>

    </div>
  );
}
