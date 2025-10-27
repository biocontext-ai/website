"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

interface ImportToChatButtonProps {
  serverName: string
  serverUrl: string
}

export default function ImportToChatButton({ serverName, serverUrl }: ImportToChatButtonProps) {
  const router = useRouter()

  const handleImportClick = () => {
    // Navigate to chat with query parameters
    const params = new URLSearchParams({
      mcpImport: "1",
      mcpName: serverName,
      mcpUrl: serverUrl,
    })
    router.push(`/chat?${params.toString()}`)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleImportClick} className="w-full">
      <MessageSquare className="w-4 h-4 mr-2" />
      Import to BioContextAI Chat
    </Button>
  )
}
