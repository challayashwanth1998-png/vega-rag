"use client";

import { api } from "@/lib/api";
import { use, useEffect, useState } from "react";
import useSWR from "swr";
import { Settings, Save, Trash2, Loader2, PaintBucket } from "lucide-react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SettingsPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;
  const router = useRouter();

  const { data: config, mutate } = useSWR(`${api.baseUrl}/api/agents/${botId}/config`, fetcher);

  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      if (!name && config.name) setName(config.name);
      if (config.brand_color) setColor(config.brand_color);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`${api.baseUrl}/api/agents/${botId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           system_prompt: config?.system_prompt || "You are a helpful AI.",
           brand_color: color,
           name: name || "Custom Agent"
        })
      });
      mutate();
    } catch(e) {}
    setIsSaving(false);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto w-full h-full overflow-y-auto">
       <div className="mb-10">
         <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
           <Settings className="w-8 h-8 text-blue-600" /> General Settings
         </h1>
         <p className="text-slate-500 mt-2 font-medium">Configure global Bot identity variables overriding default behaviors.</p>
       </div>

       <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 space-y-8">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Agent Name / Display Title</label>
            <input 
               type="text" 
               value={name}
               onChange={e => setName(e.target.value)}
               className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-800 transition-all"
            />
          </div>

          <div className="border-t border-slate-100 pt-8">
            <label className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><PaintBucket className="w-5 h-5 text-blue-500"/> Brand Widget Hex Color</label>
            <p className="text-sm text-slate-500 mb-4 font-medium">This automatically modifies the aesthetic of the embedded web widget (e.g. #FF0000).</p>
            <div className="flex items-center gap-4">
               <input 
                 type="color" 
                 value={color}
                 onChange={e => setColor(e.target.value)}
                 className="w-16 h-16 rounded-xl border-none cursor-pointer outline-none bg-transparent"
               />
               <input 
                 type="text" 
                 value={color}
                 onChange={e => setColor(e.target.value)}
                 className="flex-1 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-800 transition-all font-mono uppercase"
               />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex justify-end">
            <button disabled={isSaving} onClick={handleSave} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50">
               {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
       </div>

       <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
          <h3 className="font-bold text-red-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600/80 font-medium mb-6">Permanently purge this bot, all its Pinecone Vector indices, and conversational thread metrics. This action is absolutely irreversible.</p>
          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-sm shadow-red-600/20">
             <Trash2 className="w-5 h-5"/> Terminate Agent Ecosystem
          </button>
       </div>
    </div>
  );
}
