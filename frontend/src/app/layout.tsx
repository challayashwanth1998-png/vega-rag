import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "VegaRAG | The Enterprise AI Agent OS",
  description: "Build, deploy, and scale RAG-powered AI agents on AWS Bederock and Pinecone for your business in minutes.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌌</text></svg>',
  },
  openGraph: {
    title: "VegaRAG | AI Agent Platform",
    description: "Enterprise SaaS AI Agent Builder",
    type: "website",
    locale: "en_US",
    url: "https://vegarag.com",
    siteName: "VegaRAG",
  },
  twitter: {
    card: "summary_large_image",
    title: "VegaRAG | Enterprise AI Agent Builder",
    description: "Instant AI Agents for SaaS apps.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
