import GitHub from "@/components/icons/github"
import Zulip from "@/components/icons/zulip"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Bot, Database, Hammer, PlusCircle, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "BioContextAI - Biomedical Model Context Protocol for Agentic AI",
  description:
    "Connect agentic AI with biomedical resources using the Model Context Protocol. Discover, contribute, and use FAIR biomedical MCP servers for research and healthcare applications.",
  keywords: [
    "BioContextAI",
    "MCP",
    "Model Context Protocol",
    "biomedical AI",
    "agentic systems",
    "healthcare AI",
    "biomedical research",
    "FAIR principles",
    "bioinformatics",
    "computational biology",
    "research software",
    "AI tools",
    "MCP servers",
    "biomedical data integration",
  ],
  openGraph: {
    title: "BioContextAI - Biomedical Model Context Protocol for Agentic AI",
    description:
      "Connect agentic AI with biomedical resources using the Model Context Protocol. Discover and contribute FAIR biomedical MCP servers.",
    type: "website",
    url: "https://biocontext.ai",
    siteName: "BioContextAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "BioContextAI - Biomedical Model Context Protocol for Agentic AI",
    description: "Connect agentic AI with biomedical resources using the Model Context Protocol",
  },
}

export default function HomePage() {
  return (
    <div className="mx-auto container px-4 py-4 sm:px-6 md:py-6">
      <div className="flex flex-col gap-16 pb-16">
        {/* Hero Section */}
        <section className="text-center space-y-8 pt-16">
          <div className="space-y-4 lg:space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tight flex items-center justify-center gap-4">
              <Logo className="inline-block h-14 lg:h-20 w-auto text-primary" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-700 font-bold">
                BioContextAI
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground text-balance max-w-3xl mx-auto">
              Biomedical Model Context Protocol servers for composable agentic systems
            </p>
          </div>

          <div className="flex flex-col flex-wrap md:flex-row gap-4 items-stretch justify-center md:items-center">
            <Button asChild size="lg" className="text-lg gap-2">
              <Link href="/registry">
                <Database className="w-5 h-5" />
                Explore Registry
              </Link>
            </Button>
            <Button asChild size="lg" className="text-lg gap-2">
              <Link href="/registry/editor">
                <PlusCircle className="w-5 h-5" />
                Add MCP Server
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg gap-2">
              <Link href="/chat">
                <Bot className="w-5 h-5" />
                Try BioContextAI Chat
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg gap-2">
              <a href="https://github.com/biocontext-ai" target="_blank" rel="noopener noreferrer">
                <GitHub className="w-4 h-4 mr-2" />
                View on GitHub
              </a>
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-y-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Users className="w-6 h-6" />
                Join the Community
              </CardTitle>
              <CardDescription className="text-lg">Help advance LLM-supported biomedical research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground max-w-2xl mx-auto">
                We invite researchers and developers to engage with BioContextAI by contributing MCP servers, developing
                agents, and integrating tools into their research workflows.
              </p>
              <div className="flex flex-col md:flex-row gap-2 justify-center">
                <Button asChild variant="outline" className="w-full md:w-auto h-auto py-3 px-5 flex items-center gap-2">
                  <Link href="/docs">
                    <Book className="w-5 h-5" />
                    <span className="text-sm">Read the Documentation</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full md:w-auto h-auto py-3 px-5 flex items-center gap-2">
                  <Link
                    href="https://scverse.zulipchat.com/#narrow/channel/518508"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Zulip className="w-5 h-5" />
                    <span className="text-sm">Join Discussion on Zulip</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full md:w-auto h-auto py-3 px-5 flex items-center gap-2">
                  <Link href="/docs/registry/template" target="_blank" rel="noopener noreferrer">
                    <Hammer className="w-5 h-5" />
                    <span className="text-sm">Use the Template</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
