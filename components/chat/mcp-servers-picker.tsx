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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useChatStore } from "@/stores/chat"
import { AlertTriangle, PlusCircle, Server, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useShallow } from "zustand/react/shallow"

interface McpServer {
  name: string
  url: string
}

interface McpServerOption {
  name: string
  url: string
  identifier?: string
}

interface McpServersDialogProps {
  children: React.ReactNode
  onServersChange: (servers: McpServer[]) => void
  currentServers: McpServer[]
}

export default function McpServersDialog({ children, onServersChange, currentServers }: McpServersDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("")
  const [availableServers, setAvailableServers] = useState<McpServerOption[]>([])
  const [isLoadingServers, setIsLoadingServers] = useState(true)

  const { data: session } = useSession()

  const mcpServers = useChatStore(useShallow((state) => state.mcpServers))
  const setMcpServers = useChatStore(useShallow((state) => state.setMcpServers))

  const [localServers, setLocalServers] = useState<McpServer[]>(mcpServers)

  useEffect(() => {
    setLocalServers(mcpServers)
  }, [mcpServers])

  useEffect(() => {
    const fetchAvailableServers = async () => {
      try {
        const response = await fetch("/api/mcp/servers")
        if (!response.ok) throw new Error("Failed to fetch servers")
        const servers = await response.json()
        setAvailableServers(servers)
      } catch (error) {
        console.error("Error fetching available servers:", error)
      } finally {
        setIsLoadingServers(false)
      }
    }

    fetchAvailableServers()
  }, [])

  const handleAddServer = () => {
    if (!selectedPresetId) {
      toast.error("Please select a server")
      return
    }

    const selectedServer = availableServers.find((s) => s.url === selectedPresetId)
    if (!selectedServer) {
      toast.error("Selected server not found")
      return
    }

    if (localServers.some((server) => server.url === selectedServer.url)) {
      toast.error("This server is already added")
      return
    }

    const newServer: McpServer = {
      name: selectedServer.name,
      url: selectedServer.url,
    }
    const updatedServers = [...localServers, newServer]

    setLocalServers(updatedServers)
    setMcpServers(updatedServers)
    onServersChange(updatedServers)

    setSelectedPresetId("")

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
              <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isLoadingServers}>
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
            <Label className="text-sm font-medium">Add Server from Registry</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="server-select" className="text-xs">
                  Available Servers
                </Label>
                <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                  <SelectTrigger id="server-select" className="mt-1" disabled={isLoadingServers}>
                    {selectedPresetId && availableServers.find((s) => s.url === selectedPresetId) ? (
                      <span className="text-sm">{availableServers.find((s) => s.url === selectedPresetId)?.name}</span>
                    ) : (
                      <SelectValue placeholder={isLoadingServers ? "Loading servers..." : "Please select a server"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const selectedUrls = new Set(localServers.map((s) => s.url))
                      const availableOptions = availableServers.filter((server) => !selectedUrls.has(server.url))
                      if (availableOptions.length === 0 && !isLoadingServers) {
                        return <div className="px-2 py-1.5 text-sm text-muted-foreground">No servers available</div>
                      }
                      return availableOptions.map((server) => (
                        <SelectItem key={server.url} value={server.url} className="py-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{server.name}</span>
                            <span className="text-xs text-muted-foreground">{server.url}</span>
                          </div>
                        </SelectItem>
                      ))
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddServer} disabled={!selectedPresetId || isLoadingServers} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
