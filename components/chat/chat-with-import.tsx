"use client"

import Chat from "@/components/chat/chat"
import ImportMcpServerDialog from "@/components/chat/import-mcp-server-dialog"
import { useEffect, useState } from "react"

interface ChatWithImportProps {
  name?: string
  mcpName: string
  mcpUrl: string
}

export default function ChatWithImport({ name, mcpName, mcpUrl }: ChatWithImportProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Auto-open dialog when component mounts
  useEffect(() => {
    setDialogOpen(true)
  }, [])

  return (
    <>
      <Chat name={name} />
      <ImportMcpServerDialog open={dialogOpen} onOpenChange={setDialogOpen} presetName={mcpName} presetUrl={mcpUrl} />
    </>
  )
}
