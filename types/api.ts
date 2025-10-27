// API request and response type definitions

import { UIMessage } from "ai"

export interface ChatRequest {
  messages: UIMessage[]
  mcpServers: Array<{
    name: string
    url: string
  }>
  apiKey?: string
  selectedModel?: string
}

export interface CollectionRequest {
  name: string
  description?: string
  keywords?: string[]
  isPublic?: boolean
}

export interface CollectionItemRequest {
  mcpServerId: string
  collectionIds: string[]
  notes?: string
}

export interface BlockUserRequest {
  action: "block" | "unblock"
}

export interface BlogResponse {
  blogPost?: {
    slug: string
  }
}

export interface CollectionResponse {
  collection: any
}

export interface CollectionsResponse {
  collections: any[]
}

export interface ApiError {
  error: string
}

// Review system types
export interface ReviewRequest {
  name: string
  reviewBody: string
  isHelpful: boolean // true = thumbs up, false = thumbs down
  mcpServerId: string
}

export interface ReviewApprovalRequest {
  action: "approve" | "delete" | "delete_and_block"
}

export interface ReviewResponse {
  review?: {
    id: string
    name: string
    reviewBody: string
    isHelpful: boolean
    datePublished: string
    isPending: boolean
    isApproved: boolean
  }
}

export interface ReviewsResponse {
  reviews: any[]
}

// Registry update types
export interface RegistryUpdateResult {
  identifier: string
  name?: string
  action: "created" | "updated" | "error"
  id?: string
  error?: string
}

export interface RegistryUpdateResponse {
  message: string
  processed: number
  errors: number
  total: number
  results: RegistryUpdateResult[]
  lastUpdated: string
  blueskyPostsSuccessful?: number
  blueskyPostsTotal?: number
}

// Admin stats types
export interface ToolCallStats {
  toolName: string
  count: number
}

export interface McpServerStats {
  id: string
  name: string
  identifier: string
  totalCalls: number
  toolCalls: ToolCallStats[]
}

export interface ModelUsageStats {
  modelName: string
  totalCalls: number
  totalTokens: number
}

export interface PeriodStats {
  totalMessages: number
  totalUsers: number
  mcpServers: McpServerStats[]
  modelUsage: ModelUsageStats[]
}

export interface StatsResponse {
  last7Days: PeriodStats
  last30Days: PeriodStats
  last365Days: PeriodStats
}

// Type guard functions
export function isChatRequest(obj: unknown): obj is ChatRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "messages" in obj &&
    "mcpServers" in obj &&
    Array.isArray((obj as any).messages) &&
    Array.isArray((obj as any).mcpServers)
  )
}

export function isCollectionRequest(obj: unknown): obj is CollectionRequest {
  return typeof obj === "object" && obj !== null && "name" in obj && typeof (obj as any).name === "string"
}

export function isCollectionItemRequest(obj: unknown): obj is CollectionItemRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "mcpServerId" in obj &&
    "collectionIds" in obj &&
    typeof (obj as any).mcpServerId === "string" &&
    Array.isArray((obj as any).collectionIds)
  )
}

export function isBlockUserRequest(obj: unknown): obj is BlockUserRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "action" in obj &&
    typeof (obj as any).action === "string" &&
    ["block", "unblock"].includes((obj as any).action)
  )
}

export function isReviewRequest(obj: unknown): obj is ReviewRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    "reviewBody" in obj &&
    "isHelpful" in obj &&
    "mcpServerId" in obj &&
    typeof (obj as any).name === "string" &&
    typeof (obj as any).reviewBody === "string" &&
    typeof (obj as any).isHelpful === "boolean" &&
    typeof (obj as any).mcpServerId === "string"
  )
}

export function isReviewApprovalRequest(obj: unknown): obj is ReviewApprovalRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "action" in obj &&
    typeof (obj as any).action === "string" &&
    ["approve", "delete", "delete_and_block"].includes((obj as any).action)
  )
}

// Utility function to safely parse API response
export function hasErrorProperty(obj: unknown): obj is { error: string } {
  return typeof obj === "object" && obj !== null && "error" in obj && typeof (obj as any).error === "string"
}

export function hasCollectionProperty(obj: unknown): obj is { collection: any } {
  return typeof obj === "object" && obj !== null && "collection" in obj
}

export function hasCollectionsProperty(obj: unknown): obj is { collections: any[] } {
  return typeof obj === "object" && obj !== null && "collections" in obj && Array.isArray((obj as any).collections)
}

export function hasBlogPostProperty(obj: unknown): obj is BlogResponse {
  return typeof obj === "object" && obj !== null && "blogPost" in obj
}

export function hasReviewProperty(obj: unknown): obj is ReviewResponse {
  return typeof obj === "object" && obj !== null && "review" in obj
}

export function hasReviewsProperty(obj: unknown): obj is ReviewsResponse {
  return typeof obj === "object" && obj !== null && "reviews" in obj && Array.isArray((obj as any).reviews)
}
