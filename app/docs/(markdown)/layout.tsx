import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation | BioContextAI",
  description:
    "Learn how to use BioContextAI, contribute MCP servers, integrate biomedical tools, and build agentic AI systems for research and healthcare.",
  keywords: [
    "BioContextAI documentation",
    "MCP tutorial",
    "biomedical MCP",
    "AI research tools",
    "MCP server development",
    "registry guide",
    "knowledgebase MCP",
  ],
  openGraph: {
    title: "Documentation | BioContextAI",
    description: "Complete guide to BioContextAI and biomedical MCP servers",
    type: "website",
  },
}

export default function DocsMarkdownLayout({ children }: { children: React.ReactNode }) {
  return <div className="docs max-w-full min-w-0 prose prose-slate p-6 dark:prose-invert">{children}</div>
}
