import { ChatBox } from "@/components/ChatBox";

export default async function WidgetPage({ params }: { params: any }) {
  // Resolve params asynchronously for Next.js 15 Server Components
  const resolvedParams: any = await params;
  
  return (
    <div className="w-full h-screen bg-transparent p-1">
       {/* 
         Inside the external iframe, we render only the ChatBox!
         We default hasSources to true assuming deployed widgets already have standard memories.
       */}
       <ChatBox botId={resolvedParams.botId} hasSources={true} />
    </div>
  );
}
