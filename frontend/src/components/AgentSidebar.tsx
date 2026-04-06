"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, Activity, BarChart, Database, Layers, Users, Rocket, Settings, ArrowLeft } from "lucide-react";

export function AgentSidebar({ botId }: { botId: string }) {
  const pathname = usePathname() || "";

  const links = [
    { name: "Playground", href: `/agents/${botId}/playground`, icon: Play },
    { name: "Activity", href: `/agents/${botId}/activity`, icon: Activity },
    { name: "Analytics", href: `/agents/${botId}/analytics`, icon: BarChart },
    { name: "Data Sources", href: `/agents/${botId}/data-sources`, icon: Database },
    { name: "Workflow Studio", href: `/agents/${botId}/workflow`, icon: Layers },
    { name: "Deploy", href: `/agents/${botId}/deploy`, icon: Rocket },
    { name: "Users", href: `/agents/${botId}/users`, icon: Users },
    { name: "Settings", href: `/agents/${botId}/settings`, icon: Settings },
  ];

  return (
    <div className="h-screen w-64 bg-slate-50 border-r border-slate-200 py-6 flex flex-col shrink-0">
      <div className="px-5 mb-8">
        <Link href="/agents" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition group p-2 rounded-lg hover:bg-blue-50">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
      </div>
      <div className="px-5 mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agent Settings</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map((item) => {
          const isActive = pathname.includes(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive 
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200/60" 
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
