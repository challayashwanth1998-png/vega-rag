"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import { LoginGate } from "@/components/LoginGate";
import React, { useEffect, useState } from "react";
import { useQueryState } from "nuqs";

function AppWithAuth() {
  const [assistantId] = useQueryState("assistantId", { defaultValue: "" });
  const [agentName, setAgentName] = useState("VegaRAG");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [logoUrl, setLogoUrl] = useState("");

  // Fetch agent config for branding on the login page
  useEffect(() => {
    if (!assistantId) return;
    // Server-side proxy → VEGARAG_BACKEND_URL (works locally AND in production)
    fetch(`/chat/api/vegarag-config?bot_id=${encodeURIComponent(assistantId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          if (data.name) setAgentName(data.name);
          if (data.brand_color) setBrandColor(data.brand_color);
          if (data.chat_logo_url) setLogoUrl(data.chat_logo_url);
        }
      })
      .catch(() => {});
  }, [assistantId]);

  return (
    <LoginGate
      botId={assistantId}
      agentName={agentName}
      brandColor={brandColor}
      logoUrl={logoUrl}
    >
      <ThreadProvider>
        <StreamProvider>
          <ArtifactProvider>
            <Thread />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </LoginGate>
  );
}

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Toaster />
      <AppWithAuth />
    </React.Suspense>
  );
}
