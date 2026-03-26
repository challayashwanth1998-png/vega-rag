"use client";

import { use, useState } from "react";
import { Check, Copy, Code, Rocket, Globe, TerminalSquare } from "lucide-react";

export default function DeployPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="http://vegarag-alb-1907307840.us-east-1.elb.amazonaws.com/widget.js" data-bot-id="${botId}" defer></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto w-full h-full overflow-y-auto">
       <div className="mb-10">
         <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
           <Rocket className="w-8 h-8 text-blue-600" /> Deploy Your Agent
         </h1>
         <p className="text-slate-500 mt-2 font-medium">Embed your custom RAG agent onto your public website using this snippet.</p>
       </div>
       
       <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Code className="w-5 h-5"/></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Javascript Native Widget</h2>
                <p className="text-sm font-medium text-slate-400">Copy & paste this code inside the &lt;body&gt; tags of your website.</p>
             </div>
          </div>
          
          <div className="relative group">
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button onClick={copyToClipboard} className="p-2.5 bg-slate-800/50 hover:bg-blue-600 text-white rounded-lg transition backdrop-blur-sm flex items-center gap-2 shadow-lg">
                   {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                   <span className="text-xs font-bold">{copied ? "Copied!" : "Copy Code"}</span>
                </button>
             </div>
             
             <div className="bg-[#0f172a] rounded-2xl p-6 overflow-x-auto shadow-inner border border-slate-800">
               <pre className="text-sm font-mono text-cyan-300">
                 <code>
{`<!-- VegaRAG Agent Injection -->
<script 
  src="http://vegarag-alb-1907307840.us-east-1.elb.amazonaws.com/widget.js" 
  data-bot-id="${botId}" 
  defer>
</script>`}
                 </code>
               </pre>
             </div>
          </div>
       </div>

       <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10"><Globe className="w-40 h-40"/></div>
          <h3 className="text-2xl font-bold mb-2">Omnichannel Ready</h3>
          <p className="text-blue-100 max-w-md font-medium leading-relaxed">
            The Javascript widget creates an isolated IFrame sandboxed from your main application's CSS. 
            Because it relies purely on HTML and standard DOM injection, it supports perfectly with WordPress, Shopify, Next.js, and pure HTML sites simultaneously.
          </p>
       </div>

       <div className="mt-8 bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> Live Sandbox Simulation</h3>
            <p className="text-sm font-medium text-slate-500 max-w-lg">Before you deploy this code globally, click here to preview exactly how your custom styled RAG agent hovers over an external E-Commerce website.</p>
          </div>
          <a href={`/test-store.html?botId=${botId}`} target="_blank" rel="noreferrer" className="px-6 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-lg shrink-0">
             <TerminalSquare className="w-5 h-5"/> Launch Generic Storefront
          </a>
       </div>
    </div>
  );
}
