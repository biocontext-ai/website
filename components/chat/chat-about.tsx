"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import Link from "next/link"

export default function ChatAbout() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>BioContextAI Chat</CardTitle>
        <CardDescription>Biomedical research assistant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            API and data usage
          </AlertTitle>
          <AlertDescription className="lg:text-justify">
            You can choose between free community models and your own API keys. Please note that free models may have
            usage limits and that chat content may be accessed and used by the providers. You are responsible for the
            costs and usage of your own API keys. Data accessed through APIs exposed via MCP servers is subject to their
            respective terms and licences. You are responsible for ensuring compliance with rate limits, citation
            requirements and usage restrictions. See{" "}
            <Link href="/docs/knowledgebase" className="text-primary hover:underline">
              Data Sources and Licensing
            </Link>{" "}
            for details.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>
              Available tools are listed{" "}
              <Link href="/registry/biocontext-ai/knowledgebase-mcp?tab=tools" className="text-primary hover:underline">
                here
              </Link>
              . You can find more remote tools you can add to BioContextAI Chat in the{" "}
              <Link href="/registry" className="text-primary hover:underline">
                Registry
              </Link>
              .
            </li>
            <li>
              For research/information purposes only, no medical advice. Mistakes are common, always verify output.
            </li>
            <li>Do not submit any personal data or patient data.</li>
            <li>
              Messages are persisted locally in your browser and not stored on our servers (with the exception of error
              logs and messages in transit). We may store usage and tool call statistics. For storage policies of
              third-party LLM and MCP providers, see their respective documentation.
            </li>
            <li>
              BioContextAI, including BioContextAI Chat, is provided &quot;as is&quot; without warranties, express or
              implied (see{" "}
              <Link href="/legal/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              ).
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
