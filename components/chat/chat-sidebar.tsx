"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Conversation, useChatStore } from "@/stores/chat"
import clsx from "clsx"
import { Check, Edit2, Menu, MessageSquarePlus, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useShallow } from "zustand/react/shallow"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onUpdateTitle: (title: string) => void
  isDisabled?: boolean
}

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onUpdateTitle,
  isDisabled = false,
}: ConversationItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(conversation.title)

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== conversation.title) {
      onUpdateTitle(editedTitle.trim())
    } else {
      setEditedTitle(conversation.title)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(conversation.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  return (
    <div
      className={clsx(
        "group relative rounded-lg p-3 transition-colors w-full",
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        isActive ? "bg-primary/10" : !isDisabled && "hover:bg-muted/50",
      )}
      onClick={isDisabled ? undefined : onSelect}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-7 text-sm flex-1"
          />
          <Button variant="ghost" size="sm" onClick={handleSaveTitle} className="h-7 w-7 p-0 flex-shrink-0">
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-7 w-7 p-0 flex-shrink-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="w-full pr-16">
          <div className="font-medium text-sm break-words">{conversation.title}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <span>{formatDate(conversation.createdAt)}</span>
            <span>•</span>
            <span>
              {conversation.messages.length} {conversation.messages.length === 1 ? "message" : "messages"}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ChatSidebarContentProps {
  onClose?: () => void
  isStreaming?: boolean
}

const ChatSidebarContent = ({ onClose, isStreaming = false }: ChatSidebarContentProps) => {
  const conversations = useChatStore(useShallow((state) => state.conversations))
  const currentConversationId = useChatStore(useShallow((state) => state.currentConversationId))
  const createConversation = useChatStore(useShallow((state) => state.createConversation))
  const deleteConversation = useChatStore(useShallow((state) => state.deleteConversation))
  const setCurrentConversation = useChatStore(useShallow((state) => state.setCurrentConversation))
  const updateConversationTitle = useChatStore(useShallow((state) => state.updateConversationTitle))

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const handleCreateNew = () => {
    if (isStreaming) {
      alert("Please stop the current response before creating a new conversation.")
      return
    }
    createConversation()
    onClose?.()
  }

  const handleSelectConversation = (conversationId: string) => {
    if (isStreaming) {
      alert("Please stop the current response before switching conversations.")
      return
    }
    setCurrentConversation(conversationId)
    onClose?.()
  }

  const handleDeleteConversation = (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      deleteConversation(conversationId)
    }
  }

  return (
    <div className="flex h-full flex-col w-full">
      <div className="p-4 border-b">
        <Button onClick={handleCreateNew} className="w-full" size="sm" disabled={isStreaming}>
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 flex flex-col gap-1">
          {sortedConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentConversationId}
              isDisabled={isStreaming && conversation.id !== currentConversationId}
              onSelect={() => handleSelectConversation(conversation.id)}
              onDelete={() => handleDeleteConversation(conversation.id)}
              onUpdateTitle={(title) => updateConversationTitle(conversation.id, title)}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 px-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"} saved locally in your
          browser.
        </div>
      </div>
    </div>
  )
}

export const ChatSidebarMobile = ({ isStreaming = false }: { isStreaming?: boolean }) => {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Menu className="h-5 w-5 mr-2" />
          Conversations
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Conversations</SheetTitle>
        </SheetHeader>
        <ChatSidebarContent onClose={() => setOpen(false)} isStreaming={isStreaming} />
      </SheetContent>
    </Sheet>
  )
}

export const ChatSidebarDesktop = ({ isStreaming = false }: { isStreaming?: boolean }) => {
  return (
    <div className="hidden lg:flex w-80 border-r bg-background">
      <ChatSidebarContent isStreaming={isStreaming} />
    </div>
  )
}
