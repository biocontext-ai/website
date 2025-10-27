import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Add MCP Server | BioContextAI Registry",
  description:
    "Contribute your biomedical Model Context Protocol server to the BioContextAI Registry. Help researchers discover and use FAIR research software for AI-driven biomedical research.",
  keywords: [
    "add MCP server",
    "contribute",
    "MCP registry",
    "biomedical tools",
    "research software",
    "FAIR principles",
    "MCP submission",
    "registry editor",
  ],
  openGraph: {
    title: "Add MCP Server | BioContextAI Registry",
    description: "Contribute your biomedical MCP server to help researchers worldwide",
    type: "website",
  },
}

export default function RegistryEditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
