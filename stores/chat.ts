"use client"

import type { UIMessage } from "ai"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Types based on the existing chat structure and AI SDK
export interface McpServer {
  name: string
  url: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  messages: UIMessage[]
}

export interface ChatSettings {
  // MCP servers configuration
  mcpServers: McpServer[]

  // Model configuration
  selectedModel: string

  // API keys per provider
  googleApiKey: string | null
  openaiApiKey: string | null
  anthropicApiKey: string | null

  // Conversations
  conversations: Conversation[]
  currentConversationId: string | null
}

export interface ChatActions {
  // MCP server actions
  setMcpServers: (servers: McpServer[]) => void
  addMcpServer: (server: McpServer) => void
  removeMcpServer: (index: number) => void
  resetMcpServersToDefault: () => void

  // Model actions
  setSelectedModel: (modelId: string) => void
  setGoogleApiKey: (key: string | null) => void
  setOpenaiApiKey: (key: string | null) => void
  setAnthropicApiKey: (key: string | null) => void
  getApiKeyForModel: (modelId: string) => string | null
  setApiKeyForProvider: (provider: "google" | "openai" | "anthropic", key: string | null) => void

  // Conversation actions
  createConversation: () => string
  deleteConversation: (conversationId: string) => void
  setCurrentConversation: (conversationId: string) => void
  updateConversationTitle: (conversationId: string, title: string) => void
  getCurrentConversation: () => Conversation | null

  // Message actions - using AI SDK compatible types (work on current conversation)
  addMessage: (message: UIMessage) => void
  setMessages: (messages: UIMessage[]) => void
  updateMessage: (messageId: string, updates: Partial<UIMessage>) => void
  deleteMessage: (messageId: string) => void
  clearMessages: () => void

  // Settings actions
  resetAllSettings: () => void
}

export type ChatStore = ChatSettings & ChatActions

// Default values
const DEFAULT_MCP_SERVERS: McpServer[] = [
  { name: "BioContextAI Knowledgebase MCP", url: "https://mcp.biocontext.ai/mcp/" },
]

const DEFAULT_MODEL = "gemini-2.5-flash-latest"

// Helper to format date for default conversation title
const formatDateForTitle = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Helper to create a new conversation
const createNewConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  title: formatDateForTitle(new Date()),
  createdAt: new Date().toISOString(),
  messages: [],
})

const initialState: ChatSettings = {
  mcpServers: DEFAULT_MCP_SERVERS,
  selectedModel: DEFAULT_MODEL,
  googleApiKey: null,
  openaiApiKey: null,
  anthropicApiKey: null,
  conversations: [createNewConversation()],
  currentConversationId: null,
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // MCP server actions
      setMcpServers: (servers) =>
        set(() => ({
          mcpServers: servers,
        })),

      addMcpServer: (server) =>
        set((state) => ({
          mcpServers: [...state.mcpServers, server],
        })),

      removeMcpServer: (index) =>
        set((state) => ({
          mcpServers: state.mcpServers.filter((_, i) => i !== index),
        })),

      resetMcpServersToDefault: () =>
        set(() => ({
          mcpServers: DEFAULT_MCP_SERVERS,
        })),

      // Model actions
      setSelectedModel: (modelId) =>
        set(() => ({
          selectedModel: modelId,
        })),

      setGoogleApiKey: (key) =>
        set(() => ({
          googleApiKey: key,
        })),

      setOpenaiApiKey: (key) =>
        set(() => ({
          openaiApiKey: key,
        })),

      setAnthropicApiKey: (key) =>
        set(() => ({
          anthropicApiKey: key,
        })),

      setApiKeyForProvider: (provider, key) =>
        set(() => {
          if (provider === "google") {
            return { googleApiKey: key }
          } else if (provider === "openai") {
            return { openaiApiKey: key }
          } else {
            return { anthropicApiKey: key }
          }
        }),

      getApiKeyForModel: (modelId) => {
        const state = get()
        if (modelId.startsWith("gpt-")) {
          return state.openaiApiKey
        } else if (modelId.startsWith("claude-")) {
          return state.anthropicApiKey
        } else {
          // For Google models, return the key (null means use community key)
          return state.googleApiKey
        }
      },

      // Conversation actions
      createConversation: () => {
        const newConversation = createNewConversation()
        set((state) => ({
          conversations: [...state.conversations, newConversation],
          currentConversationId: newConversation.id,
        }))
        return newConversation.id
      },

      deleteConversation: (conversationId) =>
        set((state) => {
          const filteredConversations = state.conversations.filter((c) => c.id !== conversationId)

          // If we deleted the current conversation, switch to another one
          let newCurrentId = state.currentConversationId
          if (state.currentConversationId === conversationId) {
            // Try to find another conversation, or create a new one if none exist
            if (filteredConversations.length > 0) {
              newCurrentId = filteredConversations[0].id
            } else {
              const newConversation = createNewConversation()
              filteredConversations.push(newConversation)
              newCurrentId = newConversation.id
            }
          }

          return {
            conversations: filteredConversations,
            currentConversationId: newCurrentId,
          }
        }),

      setCurrentConversation: (conversationId) =>
        set(() => ({
          currentConversationId: conversationId,
        })),

      updateConversationTitle: (conversationId, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, title } : c)),
        })),

      getCurrentConversation: () => {
        const state = get()
        const currentId = state.currentConversationId || state.conversations[0]?.id
        return state.conversations.find((c) => c.id === currentId) || null
      },

      // Message actions (work on current conversation)
      addMessage: (message) =>
        set((state) => {
          const currentId = state.currentConversationId || state.conversations[0]?.id
          if (!currentId) return state

          return {
            conversations: state.conversations.map((c) =>
              c.id === currentId ? { ...c, messages: [...c.messages, message] } : c,
            ),
          }
        }),

      setMessages: (messages) =>
        set((state) => {
          const currentId = state.currentConversationId || state.conversations[0]?.id
          if (!currentId) return state

          // Safety check: ensure we're not accidentally mixing conversations
          const currentConversation = state.conversations.find((c) => c.id === currentId)
          if (!currentConversation) return state

          return {
            conversations: state.conversations.map((c) => (c.id === currentId ? { ...c, messages } : c)),
          }
        }),

      updateMessage: (messageId, updates) =>
        set((state) => {
          const currentId = state.currentConversationId || state.conversations[0]?.id
          if (!currentId) return state

          return {
            conversations: state.conversations.map((c) =>
              c.id === currentId
                ? {
                    ...c,
                    messages: c.messages.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)),
                  }
                : c,
            ),
          }
        }),

      deleteMessage: (messageId) =>
        set((state) => {
          const currentId = state.currentConversationId || state.conversations[0]?.id
          if (!currentId) return state

          return {
            conversations: state.conversations.map((c) =>
              c.id === currentId
                ? {
                    ...c,
                    messages: c.messages.filter((msg) => msg.id !== messageId),
                  }
                : c,
            ),
          }
        }),

      clearMessages: () =>
        set((state) => {
          const currentId = state.currentConversationId || state.conversations[0]?.id
          if (!currentId) return state

          return {
            conversations: state.conversations.map((c) => (c.id === currentId ? { ...c, messages: [] } : c)),
          }
        }),

      resetAllSettings: () => {
        const newConversation = createNewConversation()
        set(() => ({
          mcpServers: DEFAULT_MCP_SERVERS,
          selectedModel: DEFAULT_MODEL,
          googleApiKey: null,
          openaiApiKey: null,
          anthropicApiKey: null,
          conversations: [newConversation],
          currentConversationId: newConversation.id,
        }))
      },
    }),
    {
      name: "biocontext-chat-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mcpServers: state.mcpServers,
        selectedModel: state.selectedModel,
        googleApiKey: state.googleApiKey,
        openaiApiKey: state.openaiApiKey,
        anthropicApiKey: state.anthropicApiKey,
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
      version: 4,
      migrate: (persistedState: any, version: number) => {
        // Migrate from version 1 to version 2
        if (version === 1) {
          const oldState = persistedState as {
            mcpServers: McpServer[]
            selectedModel: string
            apiKey: string | null
            messages: UIMessage[]
          }

          // Create a new conversation from the old messages
          const newConversation = createNewConversation()
          if (oldState.messages && oldState.messages.length > 0) {
            newConversation.messages = oldState.messages
          }

          return {
            mcpServers: oldState.mcpServers || DEFAULT_MCP_SERVERS,
            selectedModel: oldState.selectedModel || DEFAULT_MODEL,
            googleApiKey: null,
            openaiApiKey: null,
            anthropicApiKey: null,
            conversations: [newConversation],
            currentConversationId: newConversation.id,
          }
        }

        // Migrate from version 2 to version 3
        if (version === 2) {
          const oldState = persistedState as {
            mcpServers: McpServer[]
            selectedModel: string
            apiKey: string | null
            conversations: Conversation[]
            currentConversationId: string | null
          }

          // Simplified migration: just drop old API keys
          return {
            mcpServers: oldState.mcpServers || DEFAULT_MCP_SERVERS,
            selectedModel: oldState.selectedModel || DEFAULT_MODEL,
            googleApiKey: null,
            openaiApiKey: null,
            anthropicApiKey: null,
            conversations: oldState.conversations || [createNewConversation()],
            currentConversationId: oldState.currentConversationId || null,
          }
        }

        // Migrate from version 3 to version 4
        if (version === 3) {
          const oldState = persistedState as {
            mcpServers: McpServer[]
            selectedModel: string
            googleApiKey: string | null
            openaiApiKey: string | null
            anthropicApiKey: string | null
            useGoogleCommunityKey: boolean
            conversations: Conversation[]
            currentConversationId: string | null
          }

          // Remove useGoogleCommunityKey flag - presence of googleApiKey determines usage
          return {
            mcpServers: oldState.mcpServers || DEFAULT_MCP_SERVERS,
            selectedModel: oldState.selectedModel || DEFAULT_MODEL,
            googleApiKey: oldState.googleApiKey || null,
            openaiApiKey: oldState.openaiApiKey || null,
            anthropicApiKey: oldState.anthropicApiKey || null,
            conversations: oldState.conversations || [createNewConversation()],
            currentConversationId: oldState.currentConversationId || null,
          }
        }

        return persistedState
      },
    },
  ),
)
