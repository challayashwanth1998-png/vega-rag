"use client";

import { api } from "@/lib/api";
import { use, useEffect, useState } from "react";
import useSWR from "swr";
import { Settings, Save, Trash2, Loader2, PaintBucket, MessageSquare, Image } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SettingsPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  const { data: config, mutate } = useSWR(`${api.baseUrl}/api/agents/${botId}/config`, fetcher);

  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [chatTitle, setChatTitle] = useState("");
  const [chatLogoUrl, setChatLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      if (!name && config.name) setName(config.name);
      if (config.brand_color) setColor(config.brand_color);
      if (config.chat_title !== undefined) setChatTitle(config.chat_title || "");
      if (config.chat_logo_url !== undefined) setChatLogoUrl(config.chat_logo_url || "");
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
           name: name || "Custom Agent",
           welcome_message: config?.welcome_message || "Hi! How can I assist you today?",
           chat_title: chatTitle,
           chat_logo_url: chatLogoUrl,
        })
      });
      mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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

       {/* Identity */}
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
       </div>

       {/* Chat UI Branding */}
       <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-xl"><MessageSquare className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Chat UI Branding</h2>
              <p className="text-sm text-slate-500 font-medium">Customize how the chat window appears to your end users.</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="text-sm font-bold text-slate-800 mb-2 block">Chat Window Title</label>
            <p className="text-sm text-slate-500 mb-3">The name shown in the chat header and browser tab. Defaults to the agent name if left blank.</p>
            <input 
               type="text" 
               value={chatTitle}
               onChange={e => setChatTitle(e.target.value)}
               placeholder={name || "e.g. VegaRAG Assistant"}
               className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none font-medium text-slate-800 transition-all"
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Image className="w-5 h-5 text-indigo-500" /> Chat Window Logo URL
            </label>
            <p className="text-sm text-slate-500 mb-3">Direct URL to a PNG/SVG logo shown in the chat header. Leave blank to use default logo.</p>
            <input 
               type="url" 
               value={chatLogoUrl}
               onChange={e => setChatLogoUrl(e.target.value)}
               placeholder="https://yourdomain.com/logo.png"
               className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none font-medium text-slate-800 transition-all"
            />
            {chatLogoUrl && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <img src={chatLogoUrl} alt="Logo preview" className="h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-sm text-slate-500 font-medium">Preview</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 flex justify-end">
            <button disabled={isSaving} onClick={handleSave} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50">
               {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : saved ? "✓ Saved!" : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
       </div>

       {/* Danger Zone */}
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
