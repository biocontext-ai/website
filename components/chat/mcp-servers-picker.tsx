"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useChatStore } from "@/stores/chat"
import { AlertTriangle, Loader2, PlusCircle, Server, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useShallow } from "zustand/react/shallow"

interface McpServer {
  name: string
  url: string
}

interface McpServersDialogProps {
  children: React.ReactNode
  onServersChange: (servers: McpServer[]) => void
  currentServers: McpServer[]
}

export default function McpServersDialog({ children, onServersChange, currentServers }: McpServersDialogProps) {
  const [open, setOpen] = useState(false)
  const [newServerName, setNewServerName] = useState("")
  const [newServerUrl, setNewServerUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: session } = useSession()

  const mcpServers = useChatStore(useShallow((state) => state.mcpServers))
  const setMcpServers = useChatStore(useShallow((state) => state.setMcpServers))

  const [localServers, setLocalServers] = useState<McpServer[]>(mcpServers)

  useEffect(() => {
    setLocalServers(mcpServers)
  }, [mcpServers])

  const validateUrl = async (url: string): Promise<{ valid: boolean; reason?: string }> => {
    try {
      const response = await fetch("/api/mcp/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const result = await response.json()
      return result
    } catch (error) {
      return { valid: false, reason: "Failed to validate URL" }
    }
  }

  const handleAddServer = async () => {
    const trimmedName = newServerName.trim()
    const trimmedUrl = newServerUrl.trim()

    if (!trimmedName || !trimmedUrl) {
      toast.error("Both name and URL are required")
      return
    }

    try {
      new URL(trimmedUrl)
    } catch {
      setValidationError("Please enter a valid URL format")
      return
    }

    if (localServers.some((server) => server.name === trimmedName)) {
      setValidationError("Server name already exists")
      return
    }

    setIsValidating(true)
    setValidationError(null)

    const validation = await validateUrl(trimmedUrl)

    if (!validation.valid) {
      setValidationError(validation.reason || "Invalid MCP server URL")
      setIsValidating(false)
      return
    }

    const newServer = { name: trimmedName, url: trimmedUrl }
    const updatedServers = [...localServers, newServer]

    setLocalServers(updatedServers)
    setMcpServers(updatedServers)
    onServersChange(updatedServers)

    setNewServerName("")
    setNewServerUrl("")
    setValidationError(null)
    setIsValidating(false)

    toast.success("Server added successfully")
  }

  const handleRemoveServer = (index: number) => {
    const updatedServers = localServers.filter((_, i) => i !== index)

    setLocalServers(updatedServers)
    setMcpServers(updatedServers)
    onServersChange(updatedServers)

    toast.success("Server removed successfully")
  }

  const handleReset = () => {
    const defaultServers = [{ name: "BioContextAI Knowledgebase MCP", url: "https://mcp.biocontext.ai/mcp/" }]

    setLocalServers(defaultServers)
    setMcpServers(defaultServers)
    onServersChange(defaultServers)

    toast.success("Reset to default servers")
  }

  if (!session?.user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            MCP Servers Configuration
          </DialogTitle>
          <DialogDescription>
            Configure Model Context Protocol servers available to the chatbot. This affects which tools and data sources
            are available during your conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="size-4" />
            <AlertTitle className="text-orange-800 dark:text-orange-200 font-semibold">Security Warning</AlertTitle>
            <AlertDescription className="text-sm space-y-2 text-orange-900 dark:text-orange-300">
              <p>
                <strong>Use only trusted MCP servers.</strong> These servers will have access to your conversation data.
              </p>
              <div className="mt-2 space-y-1">
                <div>• Only connect to servers you trust completely</div>
                <div>• Never connect to unknown or suspicious servers</div>
                <div>• Custom servers may have different security, privacy, and reliability standards</div>
                <div>• BioContextAI provides no warranty for third-party servers</div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Current Servers</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isValidating}>
                Reset to Default
              </Button>
            </div>
            {localServers.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No servers configured</div>
            ) : (
              <div className="space-y-2">
                {localServers.map((server, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{server.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{server.url}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveServer(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Add New Server</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="server-name" className="text-xs">
                  Server Name
                </Label>
                <Input
                  id="server-name"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="e.g., Custom MCP Server"
                  className="mt-1"
                  disabled={isValidating}
                />
              </div>
              <div>
                <Label htmlFor="server-url" className="text-xs">
                  Server URL
                </Label>
                <Input
                  id="server-url"
                  value={newServerUrl}
                  onChange={(e) => {
                    setNewServerUrl(e.target.value)
                    setValidationError(null)
                  }}
                  placeholder="e.g., https://example.com/mcp"
                  className="mt-1"
                  disabled={isValidating}
                />
              </div>
              {validationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleAddServer}
                disabled={!newServerName.trim() || !newServerUrl.trim() || isValidating}
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Server
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
