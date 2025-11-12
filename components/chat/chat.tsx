"use client"

import ChatAbout from "@/components/chat/chat-about"
import ChatSettings from "@/components/chat/chat-settings"
import { ChatSidebarDesktop, ChatSidebarMobile } from "@/components/chat/chat-sidebar"
import McpServersDialog from "@/components/chat/mcp-servers-picker"
import ModelPicker from "@/components/chat/model-picker"
import Markdown from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useChatStore } from "@/stores/chat"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, DynamicToolUIPart, TextUIPart, UIMessage } from "ai"
import clsx from "clsx"
import { ArrowUp, Check, Copy, Edit2, Loader2, MoreHorizontal, Settings, StopCircle, Trash2, X } from "lucide-react"
import Link from "next/link"
import { Fragment, ReactElement, useEffect, useRef, useState } from "react"
import { JsonView, collapseAllNested, defaultStyles } from "react-json-view-lite"
import "react-json-view-lite/dist/index.css"
import { useShallow } from "zustand/react/shallow"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"

export const maxDuration = 50

const MessageCard = ({
  user,
  message,
  rawContent,
  messageId,
  onDelete,
  onEdit,
  onRegenerateFromHere,
}: {
  user: string
  message: ReactElement
  rawContent?: string
  messageId: string
  onDelete?: () => void
  onEdit?: (newContent: string) => void
  onRegenerateFromHere?: (newContent: string) => void
}) => {
  const isBot = user === "BioContextAI Chat"
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState("")

  // Update editedContent when rawContent changes or editing starts
  useEffect(() => {
    if (isEditing && rawContent) {
      setEditedContent(rawContent)
    }
  }, [isEditing, rawContent])

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (rawContent) {
      navigator.clipboard.writeText(rawContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== rawContent && onEdit) {
      onEdit(editedContent.trim())
    }
    setIsEditing(false)
  }

  const handleRegenerateFromHere = () => {
    if (editedContent.trim() && onRegenerateFromHere) {
      onRegenerateFromHere(editedContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedContent(rawContent || "")
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      onDelete?.()
    }
  }

  return (
    <div className={clsx("flex w-full items-start gap-2 group", isBot ? "justify-start" : "justify-end")}>
      {/* Action buttons for user messages - on the left */}
      {!isBot && onDelete && (
        <div
          className="flex flex-row gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ paddingTop: "1.875rem" }}
        >
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0 hover:bg-muted"
              title="Edit message"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
            title="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Message content */}
      <div className={clsx("flex flex-col", isBot ? "items-start" : "items-end", "max-w-[85%] mb-4")}>
        <span className="text-xs font-medium text-muted-foreground mb-1 px-1">{user}</span>
        <div
          className={clsx(
            "rounded-2xl px-4 py-3 w-full max-w-full relative animate-in fade-in duration-300",
            isBot ? "bg-muted/50 text-foreground rounded-bl-md" : "bg-primary text-primary-foreground rounded-br-md",
          )}
        >
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[100px] text-sm resize-y bg-background text-foreground"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="destructive" size="sm" onClick={handleCancelEdit}>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="bg-background text-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save
                </Button>
                {onRegenerateFromHere && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRegenerateFromHere}
                    className="bg-background text-foreground"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Save & regenerate
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={clsx(
                "max-w-none mb-0",
                isBot ? "prose-slate dark:prose-invert" : "prose-primary-foreground",
                "[&_.not-prose]:not-prose [&_.not-prose_*]:not-prose",
              )}
            >
              <div className="text-sm leading-6">{message}</div>
            </div>
          )}
        </div>
        {rawContent && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-6 py-1 px-2 flex gap-1 mt-1"
            aria-label="Copy message to clipboard"
          >
            {copied ? <Check className="!size-3" /> : <Copy className="!size-3" />}
            {copied && <span className="sr-only">Copied!</span>}
            <span>Copy message</span>
          </Button>
        )}
      </div>

      {/* Action buttons for bot messages - on the right */}
      {isBot && onDelete && (
        <div
          className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ paddingTop: "1.875rem" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
            title="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

const ToolInvocationCard = ({
  toolInvocation,
  partIndex,
  onDelete,
}: {
  toolInvocation: DynamicToolUIPart | any // Accept both DynamicToolUIPart and ToolUIPart
  partIndex: string
  onDelete?: () => void
}) => {
  const [copied, setCopied] = useState(false)

  // Extract tool name from either DynamicToolUIPart or ToolUIPart
  const toolName =
    "toolName" in toolInvocation ? toolInvocation.toolName : toolInvocation.type?.replace("tool-", "") || "unknown"

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    navigator.clipboard.writeText(
      JSON.stringify({
        toolName: toolName,
        payload: toolInvocation.input,
        result: toolInvocation.output,
      }),
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (window.confirm("Are you sure you want to delete this tool call?")) {
      onDelete?.()
    }
  }

  // List of local chat tools that should have simplified display
  const localChatTools = ["sequentialThinking", "createTodoList", "setTodoState", "addTodoItem"]
  const isLocalChatTool = localChatTools.includes(toolName)

  // Special handling for local chat tools
  if (isLocalChatTool) {
    // sequentialThinking tool - always show thinking indicator
    if (toolName === "sequentialThinking") {
      if (toolInvocation.state !== "output-available") {
        // While streaming
        return (
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-lg border border-border animate-in fade-in duration-300">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground animate-pulse">Thinking...</span>
          </div>
        )
      } else {
        // When completed
        return (
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-lg border border-border animate-in fade-in duration-300">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Thinking</span>
          </div>
        )
      }
    }

    // TODO list tools - show rich visualization
    if (
      ["createTodoList", "setTodoState", "addTodoItem"].includes(toolName) &&
      toolInvocation.state === "output-available"
    ) {
      const output = toolInvocation.output as any

      // Handle TODO operations with accordion + checklist
      if (output?.items) {
        const completedCount = output.items.filter((item: any) => item.completed).length
        const totalCount = output.items.length

        return (
          <Card className="relative px-4 py-0 bg-card border-border tool-invocation animate-in fade-in duration-300">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={output.listId} className="border-none">
                <AccordionTrigger className="text-start overflow-hidden">
                  <div className="flex items-start gap-2 w-full min-w-0">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground text-left">
                        TODO: {output.title || "Untitled"} ({completedCount}/{totalCount})
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-4">
                  <div className="space-y-1">
                    {totalCount === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No items yet</p>
                      </div>
                    ) : (
                      output.items.map((item: any, idx: number) => (
                        <div key={item.id} className="flex items-start gap-2 px-1 py-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {item.completed ? (
                              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded border-2 border-muted-foreground/50" />
                            )}
                          </div>
                          <p
                            className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                          >
                            {item.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )
      }

      // Handle other TODO operations - simple confirmation (fallback)
      if (["createTodoList", "setTodoState", "addTodoItem"].includes(toolName) && output?.listId) {
        return (
          <Card className="relative px-4 py-0 bg-card border-border tool-invocation animate-in fade-in duration-300">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={output.listId} className="border-none">
                <AccordionTrigger className="text-start overflow-hidden">
                  <div className="flex items-start gap-2 w-full min-w-0">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground text-left">
                        {output.message || `${toolName} executed successfully`}
                      </p>
                      {output.itemCount && (
                        <p className="text-xs text-muted-foreground mt-1">{output.itemCount} items</p>
                      )}
                      {output.progress && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {output.progress.completed}/{output.progress.total} completed ({output.progress.percentage}%)
                        </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Request</div>
                      <Card className="p-3 bg-muted/30 border-muted">
                        <div className="max-h-48 overflow-y-auto">
                          {typeof toolInvocation.input === "object" && (
                            <JsonView
                              data={toolInvocation.input ?? {}}
                              shouldExpandNode={collapseAllNested}
                              style={{
                                ...defaultStyles,
                                container: "font-mono text-xs json-view",
                                basicChildStyle: "color: hsl(var(--foreground))",
                                label: "color: hsl(var(--primary))",
                                clickableLabel: "color: hsl(var(--primary))",
                                numberValue: "color: hsl(var(--foreground))",
                                stringValue: "color: hsl(var(--foreground))",
                                booleanValue: "color: hsl(var(--foreground))",
                                otherValue: "color: hsl(var(--foreground))",
                              }}
                            />
                          )}
                        </div>
                      </Card>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Result</div>
                      <Card className="p-3 bg-muted/30 border-muted">
                        <div className="max-h-48 overflow-y-auto">
                          {typeof output === "object" && (
                            <JsonView
                              data={output ?? {}}
                              shouldExpandNode={collapseAllNested}
                              style={{
                                ...defaultStyles,
                                container: "font-mono text-xs json-view",
                                basicChildStyle: "color: hsl(var(--foreground))",
                                label: "color: hsl(var(--primary))",
                                clickableLabel: "color: hsl(var(--primary))",
                                numberValue: "color: hsl(var(--foreground))",
                                stringValue: "color: hsl(var(--foreground))",
                                booleanValue: "color: hsl(var(--foreground))",
                                otherValue: "color: hsl(var(--foreground))",
                              }}
                            />
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )
      }
    }

    // While streaming TODO tools
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-lg border border-border animate-in fade-in duration-300">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{toolName}...</span>
      </div>
    )
  }

  return (
    <Card className="relative px-4 py-0 bg-card border-border tool-invocation animate-in fade-in duration-300">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem key={toolInvocation.toolCallId} value={toolInvocation.toolCallId} className="border-none">
          <AccordionTrigger className="text-start overflow-hidden">
            <div className="flex items-center justify-between gap-2 pe-1 w-full min-w-0">
              <div className="text-sm font-mono font-semibold text-primary truncate min-w-0 flex-1">{toolName}</div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onDelete && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                    aria-label="Delete tool call"
                    role="button"
                  >
                    <div>
                      <Trash2 className="h-4 w-4" />
                    </div>
                  </Button>
                )}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label="Copy tool call to clipboard"
                  role="button"
                >
                  <div>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied && <span className="sr-only">Copied!</span>}
                  </div>
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Request</div>
                <Card className="p-3 bg-muted/30 border-muted">
                  <div className="max-h-48 overflow-y-auto">
                    {typeof toolInvocation.input === "object" && (
                      <JsonView
                        data={toolInvocation.input ?? {}}
                        shouldExpandNode={collapseAllNested}
                        style={{
                          ...defaultStyles,
                          container: "font-mono text-xs json-view",
                          basicChildStyle: "color: hsl(var(--foreground))",
                          label: "color: hsl(var(--primary))",
                          clickableLabel: "color: hsl(var(--primary))",
                          numberValue: "color: hsl(var(--foreground))",
                          stringValue: "color: hsl(var(--foreground))",
                          booleanValue: "color: hsl(var(--foreground))",
                          otherValue: "color: hsl(var(--foreground))",
                        }}
                      />
                    )}
                  </div>
                </Card>
              </div>

              {toolInvocation.state === "output-available" &&
                typeof toolInvocation.output === "object" &&
                toolInvocation.output !== null &&
                Object.keys(toolInvocation.output ?? {}).length >= 1 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Result</div>
                    <Card className="p-3 bg-muted/30 border-muted">
                      <div className="max-h-48 overflow-y-auto">
                        {!(toolInvocation.output as any)?.isError &&
                          (toolInvocation.output as any)?.structuredContent && (
                            <JsonView
                              data={(toolInvocation.output as any).structuredContent}
                              shouldExpandNode={collapseAllNested}
                              style={{
                                ...defaultStyles,
                                container: "font-mono text-xs json-view",
                                basicChildStyle: "color: hsl(var(--foreground))",
                                label: "color: hsl(var(--primary))",
                                clickableLabel: "color: hsl(var(--primary))",
                                numberValue: "color: hsl(var(--foreground))",
                                stringValue: "color: hsl(var(--foreground))",
                                booleanValue: "color: hsl(var(--foreground))",
                                otherValue: "color: hsl(var(--foreground))",
                              }}
                            />
                          )}
                      </div>
                    </Card>
                  </div>
                )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

// Collapsible reasoning display similar to tool invocation card
const ReasoningCard = ({
  text,
  isStreaming,
  reasoningIndex,
}: {
  text: string
  isStreaming: boolean
  reasoningIndex: number
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="relative px-4 py-0 bg-card border-border reasoning-invocation animate-in fade-in duration-300">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`reasoning-${reasoningIndex}`} className="border-none">
          <AccordionTrigger className="text-start overflow-hidden">
            <div className="flex items-center justify-between gap-2 pe-1 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                ) : (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <div className="text-sm font-medium text-muted-foreground truncate">Reasoning</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label="Copy reasoning to clipboard"
                  role="button"
                >
                  <div>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied && <span className="sr-only">Copied!</span>}
                  </div>
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-4">
            <div className="prose prose-sm max-w-none">
              <Markdown>{text}</Markdown>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

export default function Chat({ name: name }: { name?: string }) {
  const form = useRef<HTMLFormElement>(null)

  // Use Zustand store for all chat state
  const mcpServers = useChatStore(useShallow((state) => state.mcpServers))
  const selectedModel = useChatStore(useShallow((state) => state.selectedModel))
  const googleApiKey = useChatStore(useShallow((state) => state.googleApiKey))
  const openaiApiKey = useChatStore(useShallow((state) => state.openaiApiKey))
  const anthropicApiKey = useChatStore(useShallow((state) => state.anthropicApiKey))
  const groqApiKey = useChatStore(useShallow((state) => state.groqApiKey))
  const setMcpServers = useChatStore(useShallow((state) => state.setMcpServers))

  // Get API key based on selected model
  const apiKey = (() => {
    if (selectedModel.startsWith("groq-")) return groqApiKey
    if (selectedModel.startsWith("gpt-")) return openaiApiKey
    if (selectedModel.startsWith("claude-")) return anthropicApiKey
    // For Google models, return the key (null means use community key)
    return googleApiKey
  })()

  const addMessage = useChatStore(useShallow((state) => state.addMessage))
  const setMessages = useChatStore(useShallow((state) => state.setMessages))
  const deleteMessage = useChatStore(useShallow((state) => state.deleteMessage))
  const updateMessage = useChatStore(useShallow((state) => state.updateMessage))

  const [input, setInput] = useState("")

  // Get current conversation ID from store directly
  const currentConversationId = useChatStore(useShallow((state) => state.currentConversationId))
  const conversations = useChatStore(useShallow((state) => state.conversations))
  const setCurrentConversation = useChatStore(useShallow((state) => state.setCurrentConversation))

  // Find the current conversation from the list
  const currentConversation = conversations.find((c) => c.id === currentConversationId) || conversations[0]

  // Ensure we have a current conversation ID set
  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversation(conversations[0].id)
    }
  }, [currentConversationId, conversations, setCurrentConversation])

  // Track which conversation ID we've loaded into the AI SDK to prevent cross-contamination
  const loadedConversationIdRef = useRef<string | null>(null)

  const {
    messages,
    sendMessage,
    error,
    setMessages: setAiMessages,
    stop,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/",
    }),
    onFinish: ({ message }: { message: UIMessage }) => {
      addMessage(message)
    },
    experimental_throttle: 50,
  })

  // Load conversation messages when conversation ID changes
  useEffect(() => {
    if (currentConversation && currentConversation.id !== loadedConversationIdRef.current) {
      // Update the ref to track which conversation is loaded
      loadedConversationIdRef.current = currentConversation.id
      // Load the conversation's messages into AI SDK
      setAiMessages(currentConversation.messages)
    }
  }, [currentConversation, setAiMessages])

  // Sync messages back to store after they update
  useEffect(() => {
    // Only sync if:
    // 1. We have a current conversation
    // 2. The loaded conversation ID matches the current conversation ID (no race condition)
    // 3. We're not currently streaming
    // 4. Messages actually changed
    if (currentConversation && loadedConversationIdRef.current === currentConversation.id && status === "ready") {
      // Check if messages have actually changed
      const messageIdsMatch =
        messages.length === currentConversation.messages.length &&
        messages.every((m, i) => m.id === currentConversation.messages[i]?.id)

      // Only sync if messages changed
      if (!messageIdsMatch) {
        setMessages(messages)
      }
    }
  }, [messages, status, setMessages, currentConversation])

  // Custom submit handler that syncs user message immediately
  const handleSubmitAction = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault()
    }

    if (!input.trim()) return

    if (["submitted", "streaming"].includes(status)) return

    // Add user message to store immediately
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      parts: [
        {
          type: "text",
          text: input.trim(),
        } as TextUIPart,
      ],
    }

    // Update store with user message and send it
    addMessage(userMessage)
    sendMessage(userMessage, {
      body: {
        mcpServers,
        apiKey,
        selectedModel,
      },
    })

    setInput("")
  }

  // Helper function to extract raw text content from message parts
  const extractRawContent = (message: any): string => {
    if (!message.parts) {
      // Fallback for messages without parts structure
      return message.content || ""
    }

    return message.parts
      .filter((part: any) => part.type === "text" || part.type === "reasoning")
      .map((part: any) => part.text || part.reasoningText || "")
      .join("\n\n")
      .trim()
  }

  // Handle message deletion
  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId)
    // Also update AI SDK messages
    setAiMessages(messages.filter((m) => m.id !== messageId))
  }

  // Handle message editing
  const handleEditMessage = (messageId: string, newContent: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    // Update the message with new content
    const updatedMessage: UIMessage = {
      ...message,
      parts: [
        {
          type: "text",
          text: newContent,
        } as TextUIPart,
      ],
    }

    updateMessage(messageId, updatedMessage)
    // Also update AI SDK messages
    setAiMessages(messages.map((m) => (m.id === messageId ? updatedMessage : m)))
  }

  // Handle regenerate from here - edit message and regenerate response
  const handleRegenerateFromHere = (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    // Create updated message
    const updatedMessage: UIMessage = {
      ...messages[messageIndex],
      parts: [
        {
          type: "text",
          text: newContent,
        } as TextUIPart,
      ],
    }

    // Get all messages up to but NOT including the edited message
    const messagesUpToEdit = messages.slice(0, messageIndex)

    // Update both stores with truncated messages (without the edited message yet)
    setMessages(messagesUpToEdit)
    setAiMessages(messagesUpToEdit)

    // Send the updated message to regenerate response
    // sendMessage will automatically add the message to the messages array
    sendMessage(updatedMessage, {
      body: {
        mcpServers,
        apiKey,
        selectedModel,
      },
    })
  }

  // Handle deleting a specific tool part from a message
  const handleDeleteToolPart = (messageId: string, partIndex: number) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message || !message.parts) return

    // Filter out the tool part at the specified index
    const updatedParts = message.parts.filter((_, index) => index !== partIndex)

    // Update the message with the remaining parts
    const updatedMessage: UIMessage = {
      ...message,
      parts: updatedParts,
    }

    updateMessage(messageId, updatedMessage)
    // Also update AI SDK messages
    setAiMessages(messages.map((m) => (m.id === messageId ? updatedMessage : m)))
  }

  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  useEffect(() => {
    function updateScrollbarWidth() {
      if (typeof window === "undefined") return
      const chatElem = window.document.getElementById("chat")
      if (chatElem) {
        setScrollbarWidth(chatElem.offsetWidth - chatElem.clientWidth)
      }
    }
    updateScrollbarWidth()
    window.addEventListener("resize", updateScrollbarWidth)
    return () => window.removeEventListener("resize", updateScrollbarWidth)
  }, [])

  // Check if currently streaming
  const isStreaming = ["submitted", "streaming"].includes(status)

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))]">
      <ChatSidebarDesktop isStreaming={isStreaming} />
      <div className="flex-1 flex flex-col relative w-full">
        <div className="lg:hidden border-b bg-background px-4 py-2">
          <ChatSidebarMobile isStreaming={isStreaming} />
        </div>

        <div
          className={`relative flex ${messages.length >= 1 ? "flex-col-reverse pb-56" : "flex-col pb-60"} h-full overflow-y-scroll w-full bg-background`}
          id="chat"
          style={{
            scrollBehavior: "smooth",
            paddingInlineStart: Math.round(scrollbarWidth),
          }}
        >
          <div className="w-full mt-8 px-4 lg:px-8">
            <div className="max-w-5xl mx-auto flex flex-col">
              {messages.length <= 0 && <ChatAbout />}

              {messages.map((m, index) => {
                const rawContent = extractRawContent(m)
                const isUserMessage = m.role === "user"
                return (
                  <Fragment key={m.id}>
                    <MessageCard
                      key={index}
                      messageId={m.id}
                      user={isUserMessage ? (name ? name : "You") : "BioContextAI Chat"}
                      rawContent={rawContent}
                      onDelete={() => handleDeleteMessage(m.id)}
                      onEdit={isUserMessage ? (newContent) => handleEditMessage(m.id, newContent) : undefined}
                      onRegenerateFromHere={
                        isUserMessage ? (newContent) => handleRegenerateFromHere(m.id, newContent) : undefined
                      }
                      message={
                        <>
                          {m.parts?.map((part, partIndex) => (
                            <Fragment key={partIndex}>
                              {part.type === "reasoning" && (
                                <div className="py-1.5">
                                  <ReasoningCard
                                    text={part.text}
                                    isStreaming={
                                      (status === "submitted" || status === "streaming") &&
                                      partIndex === (m.parts?.length || 0) - 1
                                    }
                                    reasoningIndex={partIndex}
                                  />
                                </div>
                              )}
                              {(part.type === "dynamic-tool" ||
                                (typeof part.type === "string" && part.type.startsWith("tool-"))) && (
                                <div className="py-1.5">
                                  <ToolInvocationCard
                                    toolInvocation={part as DynamicToolUIPart}
                                    partIndex={`tool-${partIndex}`}
                                    onDelete={!isUserMessage ? () => handleDeleteToolPart(m.id, partIndex) : undefined}
                                  />
                                </div>
                              )}
                              {part.type === "text" && (
                                <div className="prose prose-sm animate-in fade-in duration-300">
                                  <Markdown>{part.text}</Markdown>
                                </div>
                              )}
                            </Fragment>
                          ))}
                        </>
                      }
                    />
                  </Fragment>
                )
              })}
              {messages.length > 0 && error !== undefined && (
                <Fragment key="error">
                  <MessageCard
                    messageId="error"
                    user="BioContextAI Chat"
                    message={
                      <div className="text-destructive animate-in fade-in duration-300">
                        <strong>Error:</strong> {error.message}
                      </div>
                    }
                  />
                </Fragment>
              )}
              {status === "submitted" && (
                <div className="flex w-full items-start gap-2 justify-start mb-4 animate-in fade-in duration-300">
                  <div className="flex flex-col items-start max-w-[85%]">
                    <span className="text-xs font-medium text-muted-foreground mb-1 px-1">BioContextAI Chat</span>
                    <div className="rounded-2xl px-4 py-3 bg-muted/50 text-foreground rounded-bl-md">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                        </div>
                        <span className="text-sm text-muted-foreground">Processing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 w-full h-40 bg-gradient-to-t from-background via-background to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 w-full px-4 lg:px-8 pb-4">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-2 gap-2 border-b">
                <ModelPicker setMessages={setAiMessages} />
                <div className="flex items-center gap-1">
                  <McpServersDialog onServersChange={setMcpServers} currentServers={mcpServers}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">MCP Servers Settings</span>
                    </Button>
                  </McpServersDialog>
                  <ChatSettings setMessages={setAiMessages}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Chat Settings</span>
                    </Button>
                  </ChatSettings>
                </div>
              </div>
              <div className="p-2">
                <form className="flex min-h-16 relative" onSubmit={handleSubmitAction} ref={form}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitAction()
                      }
                    }}
                    minLength={3}
                    maxLength={2048}
                    autoFocus
                    className="py-2 lg:py-4 pl-2 lg:pl-6 pr-12 lg:pr-16 text-sm resize-none w-full h-full rounded-lg border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus:outline-none"
                    placeholder="E.g., which proteins interact with human SYNPO according to STRING?"
                  />
                  {["ready", "error"].includes(status) && (
                    <Button
                      className="absolute bottom-2 right-2 lg:bottom-3 lg:right-3 w-8 h-8 lg:w-10 lg:h-10 p-0"
                      type="submit"
                      disabled={!input.trim()}
                      size="sm"
                    >
                      <ArrowUp className="size-3 lg:size-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  )}
                  {["submitted", "streaming"].includes(status) && (
                    <Button
                      className="absolute bottom-2 right-2 lg:bottom-3 lg:right-3 w-8 h-8 lg:w-10 lg:h-10 p-0"
                      onClick={() => stop()}
                      type="button"
                      size="sm"
                    >
                      <StopCircle className="size-3 lg:size-4" />
                      <span className="sr-only">Stop</span>
                    </Button>
                  )}
                </form>
              </div>
            </Card>
            <div className="text-center py-2 text-balance text-[0.5rem] text-muted-foreground select-none">
              Information purposes only. No medical advice. Verify responses. Do not submit personal or copyrighted
              data. By using this service, you agree to our{" "}
              <Link href="/legal/terms" className="underline hover:text-primary transition-colors">
                Terms of Service
              </Link>{" "}
              and confirm that you have read our{" "}
              <Link href="/legal/privacy" className="underline hover:text-primary transition-colors">
                Privacy Policy
              </Link>{" "}
              and the{" "}
              <Link href="/docs/knowledgebase" className="underline hover:text-primary transition-colors">
                Data Sources and Licensing
              </Link>{" "}
              section.{" "}
              <Link href="/legal/notice" className="underline hover:text-primary transition-colors">
                Legal Notice & Disclaimer
              </Link>
              . Logos may be trademarked and remain the property of their respective owner.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
