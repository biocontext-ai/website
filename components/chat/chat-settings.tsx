"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useChatStore } from "@/stores/chat"
import { UIMessage } from "ai"
import { MessageSquare, RotateCcw, Settings2, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useShallow } from "zustand/react/shallow"

interface ChatSettingsProps {
  children: React.ReactNode
  setMessages: (messages: UIMessage[]) => void
}

export default function ChatSettings({ children, setMessages }: ChatSettingsProps) {
  const [open, setOpen] = useState(false)
  const getCurrentConversation = useChatStore(useShallow((state) => state.getCurrentConversation))
  const clearMessages = useChatStore(useShallow((state) => state.clearMessages))
  const resetAllSettings = useChatStore(useShallow((state) => state.resetAllSettings))

  const currentConversation = getCurrentConversation()
  const messages = currentConversation?.messages || []

  const handleResetConversation = () => {
    clearMessages()
    setMessages([])
    setOpen(false)
    toast.success("Conversation history cleared")
  }

  const handleResetAllSettings = () => {
    resetAllSettings()
    setMessages([])
    setOpen(false)
    toast.success("All settings reset to defaults")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Chat Settings
          </DialogTitle>
          <DialogDescription>
            Manage your chat history and settings. All data is stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conversation History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Conversation History</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {messages.length === 0
                ? "No conversation history stored locally"
                : `${messages.length} message${messages.length === 1 ? "" : "s"} stored locally`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetConversation}
              disabled={messages.length === 0}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Conversation History
            </Button>
          </div>

          <Separator />

          {/* Reset All Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="text-sm font-medium">Reset All Settings</span>
            </div>
            <div className="text-sm text-muted-foreground">
              This will reset all your preferences including MCP servers, selected model, API key, and conversation
              history to their defaults.
            </div>
            <Button variant="destructive" size="sm" onClick={handleResetAllSettings} className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
