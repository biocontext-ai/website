"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useChatStore } from "@/stores/chat"
import { AlertTriangle, Check, Server } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useShallow } from "zustand/react/shallow"

interface ImportMcpServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetName?: string
  presetUrl?: string
}

export default function ImportMcpServerDialog({
  open,
  onOpenChange,
  presetName = "",
  presetUrl = "",
}: ImportMcpServerDialogProps) {
  const [serverName, setServerName] = useState(presetName)
  const [serverUrl, setServerUrl] = useState(presetUrl)
  const [isImporting, setIsImporting] = useState(false)
  const router = useRouter()

  const mcpServers = useChatStore(useShallow((state) => state.mcpServers))
  const addMcpServer = useChatStore(useShallow((state) => state.addMcpServer))

  // Update fields when preset values change
  useEffect(() => {
    setServerName(presetName)
    setServerUrl(presetUrl)
  }, [presetName, presetUrl])

  const handleImport = async () => {
    const trimmedName = serverName.trim()
    const trimmedUrl = serverUrl.trim()

    if (!trimmedName || !trimmedUrl) {
      toast.error("Both name and URL are required")
      return
    }

    // Basic URL validation
    try {
      new URL(trimmedUrl)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    // Check for duplicate names
    if (mcpServers.some((server) => server.name === trimmedName)) {
      toast.error("A server with this name already exists in your configuration")
      return
    }

    // Check for duplicate URLs
    if (mcpServers.some((server) => server.url === trimmedUrl)) {
      toast.error("This server URL is already configured")
      return
    }

    setIsImporting(true)

    try {
      // Add server to store
      addMcpServer({ name: trimmedName, url: trimmedUrl })

      toast.success(`${trimmedName} has been added to your chat configuration`)

      // Close dialog
      onOpenChange(false)

      // Navigate to chat
      router.push("/chat")
    } catch (error) {
      console.error("Error importing server:", error)
      toast.error("Failed to import server")
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Import MCP Server to Chat
          </DialogTitle>
          <DialogDescription>
            Add this MCP server to your chat configuration to use it in conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Security Warning */}
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="size-4" />
            <AlertTitle className="text-orange-800 dark:text-orange-200 font-semibold">Security Warning</AlertTitle>
            <AlertDescription className="text-sm space-y-2 text-orange-900 dark:text-orange-300">
              <div className="space-y-1">
                <div>• Only import servers you trust completely</div>
                <div>• This server will have access to your conversation data</div>
                <div>• Custom servers may have different security and privacy standards</div>
                <div>• Review the server&apos;s documentation and reputation before importing</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Server Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="import-server-name">Server Name</Label>
              <Input
                id="import-server-name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="e.g., My MCP Server"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="import-server-url">Server URL</Label>
              <Input
                id="import-server-url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="e.g., https://example.com/mcp"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!serverName.trim() || !serverUrl.trim() || isImporting}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Importing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Import Server
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
