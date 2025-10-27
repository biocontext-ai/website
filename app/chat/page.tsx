import { auth } from "@/auth"
import Chat from "@/components/chat/chat"
import ChatSignInRequired from "@/components/chat/chat-signin-required"
import ChatWithImport from "@/components/chat/chat-with-import"
import NoSsr from "@/components/no-ssr"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Chat | BioContextAI",
  description:
    "Try BioContextAI's proof-of-concept chatbot with integrated biomedical MCP servers. Access protein interactions, gene data, antibody information, and more through natural conversation.",
  keywords: [
    "BioContextAI chat",
    "biomedical chatbot",
    "MCP chat",
    "AI assistant",
    "biomedical AI",
    "research chat",
    "protein data",
    "gene information",
    "conversational AI",
  ],
  openGraph: {
    title: "Chat | BioContextAI",
    description: "Interactive chatbot with biomedical MCP servers for research and data exploration",
    type: "website",
  },
}

export default async function ChatHome({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()

  // If user is not authenticated, show sign-in required component
  if (!session?.user) {
    return <ChatSignInRequired />
  }

  const params = await searchParams
  const mcpImport = params.mcpImport === "1"
  const mcpName = typeof params.mcpName === "string" ? params.mcpName : undefined
  const mcpUrl = typeof params.mcpUrl === "string" ? params.mcpUrl : undefined

  return (
    <Suspense>
      <NoSsr>
        {mcpImport && mcpName && mcpUrl ? (
          <ChatWithImport name={session.user.name ?? undefined} mcpName={mcpName} mcpUrl={mcpUrl} />
        ) : (
          <Chat name={session.user.name ?? undefined} />
        )}
      </NoSsr>
    </Suspense>
  )
}
