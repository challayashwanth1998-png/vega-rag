import { AgentSidebar } from "@/components/AgentSidebar";

export default async function AgentLayout({ children, params }: { children: React.ReactNode, params: any }) {
  // Unwrap parameters per Next.js 15 rules using async await for layouts
  const resolvedParams: any = await params;
  
  return (
    <div className="flex h-screen w-full bg-white relative font-sans overflow-hidden">
      <AgentSidebar botId={resolvedParams.botId} />
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
