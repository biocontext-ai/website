export type ChatModelProvider = "google" | "openai" | "anthropic" | "groq"

export interface ChatModel {
  id: string
  name: string
  provider: ChatModelProvider
  requiresApiKey: boolean
  supportsOptionalApiKey?: boolean
  description?: string
  badge?: string
}

export const DEFAULT_CHAT_MODEL = "gemini-3.8-flash"

export const FREE_TIER_GOOGLE_MODELS: readonly string[] = [DEFAULT_CHAT_MODEL]

export const CHAT_MODELS: readonly ChatModel[] = [
  {
    id: DEFAULT_CHAT_MODEL,
    name: "Gemini 3.8 Flash",
    provider: "google",
    requiresApiKey: false,
    supportsOptionalApiKey: true,
    description:
      "Free with community key, or use your own API key for higher limits. Chats used by the provider to improve their products.",
    badge: "Free",
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    provider: "anthropic",
    requiresApiKey: true,
    description: "Fastest, lower cost Anthropic model",
    badge: "API Key Required",
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    provider: "anthropic",
    requiresApiKey: true,
    description: "Best balance of speed and intelligence",
    badge: "API Key Required",
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    provider: "anthropic",
    requiresApiKey: true,
    description: "Recommended Anthropic model for most workloads",
    badge: "API Key Required",
  },
  {
    id: "claude-fable-5-1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    requiresApiKey: true,
    description: "Most capable Anthropic model for demanding reasoning",
    badge: "API Key Required",
  },
  {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    provider: "openai",
    requiresApiKey: true,
    description: "Efficient, cost-optimized OpenAI model",
    badge: "API Key Required",
  },
  {
    id: "gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    provider: "openai",
    requiresApiKey: true,
    description: "Near-flagship OpenAI model at lower cost",
    badge: "API Key Required",
  },
  {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    provider: "openai",
    requiresApiKey: true,
    description: "Most capable OpenAI model",
    badge: "API Key Required",
  },
  {
    id: "groq-openai/gpt-oss-20b",
    name: "GPT OSS 20B (Groq)",
    provider: "groq",
    requiresApiKey: true,
    description: "Fast inference with Groq",
    badge: "API Key Required",
  },
  {
    id: "groq-openai/gpt-oss-120b",
    name: "GPT OSS 120B (Groq)",
    provider: "groq",
    requiresApiKey: true,
    description: "Fast inference with Groq",
    badge: "API Key Required",
  },
]

export const isSupportedChatModel = (modelId: string): boolean => CHAT_MODELS.some((model) => model.id === modelId)
