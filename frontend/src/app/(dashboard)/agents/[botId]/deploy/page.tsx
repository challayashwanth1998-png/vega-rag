"use client";

import { use, useState, useEffect } from "react";
import { Check, Copy, Code, Rocket, TerminalSquare, MessageSquare, Globe, Users } from "lucide-react";
import Link from "next/link";

export default function DeployPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  const [hostUrl, setHostUrl] = useState("https://vegarag.com");
  const [copiedBubble, setCopiedBubble] = useState(false);
  const [copiedCanvas, setCopiedCanvas] = useState(false);
  
  // Anti-cache timestamp
  const version = "1.1";

  useEffect(() => {
    setHostUrl(window.location.origin);
  }, []);

  const chatAppUrl = `${hostUrl}/chat/?assistantId=${botId}`;

  const bubbleCode = `<!-- VegaRAG Chat Bubble -->
<script 
  src="${hostUrl}/widget.js?v=${version}" 
  data-bot-id="${botId}" 
  data-mode="customer-service"
  defer>
</script>`;

  const canvasCode = `<!-- VegaRAG Immersive Canvas -->
<script 
  src="${hostUrl}/widget.js?v=${version}" 
  data-bot-id="${botId}" 
  data-mode="immersive-chat"
  defer>
</script>`;

  const copyCode = (code: string, type: "bubble" | "canvas") => {
    navigator.clipboard.writeText(code);
    if (type === "bubble") {
       setCopiedBubble(true);
       setTimeout(() => setCopiedBubble(false), 2000);
    } else {
       setCopiedCanvas(true);
       setTimeout(() => setCopiedCanvas(false), 2000);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto w-full h-full overflow-y-auto font-sans">
       <div className="mb-12">
         <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 mb-3">
           <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
               <Rocket className="w-8 h-8 text-white" />
           </div>
           Deploy Agent
         </h1>
         <p className="text-slate-500 text-lg font-medium max-w-2xl">
            Choose your preferred interface style and drop the corresponding HTML snippet directly into your application.
         </p>
       </div>
       
        <div className="mb-12">
          {/* OPTION 1: LIVE HOSTED APP */}
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
             <Globe className="w-6 h-6 text-indigo-500" /> Live Hosted Application
          </h2>
          <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row items-stretch">
             <div className="p-8 lg:w-2/3 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-center">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Authenticated Chat Portal</h3>
                 <p className="text-slate-500 font-medium leading-relaxed mb-6">
                    A standalone, full-screen chat interface powered by your agent. Users you invite via the <strong>Users</strong> tab can securely log in using this URL. 
                    No code integration required.
                 </p>
                 <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-2">
                    <input type="text" readOnly value={chatAppUrl} className="flex-1 bg-transparent px-4 font-mono text-sm text-slate-600 outline-none" />
                    <button onClick={() => { navigator.clipboard.writeText(chatAppUrl); setCopiedBubble(true); setTimeout(() => setCopiedBubble(false), 2000); }} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition">
                       Copy Link
                    </button>
                 </div>
             </div>
             <div className="bg-slate-50 p-8 lg:w-1/3 flex flex-col items-center justify-center gap-4">
                 <a href={chatAppUrl} target="_blank" rel="noreferrer" className="w-full py-3 text-center bg-white border-2 border-indigo-600 text-indigo-700 font-black rounded-xl hover:bg-indigo-50 transition-all">
                    Open App
                 </a>
                 <Link href={`/agents/${botId}/users`} className="w-full py-3 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1">
                    <Users className="w-4 h-4" /> Manage End-Users
                 </Link>
             </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
             <Code className="w-6 h-6 text-blue-500" /> Embedded Widgets
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* OPTION 2: CUSTOMER SERVICE BUBBLE */}
            <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-8 border-b border-slate-100 flex-1">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                     <MessageSquare className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Customer Service Bubble</h2>
                  <p className="text-slate-500 font-medium leading-relaxed mb-6 gap-2">
                     A polite, floating action button nested in the bottom corner of your UI. Expands into a compact chat window.
                  </p>
                  <div className="bg-slate-900 rounded-2xl p-6 relative group overflow-hidden border border-slate-800 shadow-inner">
                     <div className="absolute top-4 right-4 z-10">
                        <button onClick={() => copyCode(bubbleCode, "bubble")} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-500 transition flex items-center gap-2">
                           {copiedBubble ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                           {copiedBubble ? "Copied" : "Copy"}
                        </button>
                     </div>
                     <pre className="text-xs font-mono text-emerald-400 overflow-x-auto pt-8 pb-2">
                        <code>{bubbleCode}</code>
                     </pre>
                  </div>
               </div>
               <div className="bg-slate-50 p-6 flex flex-col items-center border-t border-slate-100">
                  <a href={`/test-store.html?botId=${botId}&mode=customer-service&v=${version}`} target="_blank" rel="noreferrer" className="w-full py-4 text-center bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1">
                     Live Preview Viewer &rarr;
                  </a>
               </div>
            </div>

            {/* OPTION 3: IMMERSIVE CANVAS */}
            <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-8 border-b border-slate-100 flex-1">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                     <TerminalSquare className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Immersive Canvas</h2>
                  <p className="text-slate-500 font-medium leading-relaxed mb-6 gap-2">
                     A full-screen, focused application takeover similar to ChatGPT. Perfect for internal tooling or deep work.
                  </p>
                  <div className="bg-slate-900 rounded-2xl p-6 relative group overflow-hidden border border-slate-800 shadow-inner">
                     <div className="absolute top-4 right-4 z-10">
                        <button onClick={() => copyCode(canvasCode, "canvas")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-500 transition flex items-center gap-2">
                           {copiedCanvas ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                           {copiedCanvas ? "Copied" : "Copy"}
                        </button>
                     </div>
                     <pre className="text-xs font-mono text-emerald-400 overflow-x-auto pt-8 pb-2">
                        <code>{canvasCode}</code>
                     </pre>
                  </div>
               </div>
               <div className="bg-slate-50 p-6 flex flex-col items-center border-t border-slate-100">
                  <a href={`/test-store.html?botId=${botId}&mode=immersive-chat&v=${version}`} target="_blank" rel="noreferrer" className="w-full py-4 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1">
                     Live Preview Viewer &rarr;
                  </a>
               </div>
            </div>
          </div>
        </div>
    </div>
  );
}
