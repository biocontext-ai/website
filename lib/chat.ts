import "server-only"

import { prisma } from "@/lib/prisma"
import type { LanguageModelUsage } from "ai"

interface ToolCallInfo {
  toolName: string
}

/**
 * Extract tool calls from AI SDK steps
 * Tool names come directly from the MCP servers
 */
function extractToolCallsFromSteps(steps: any[]): ToolCallInfo[] {
  const toolCallsMap = new Map<string, ToolCallInfo>()

  for (const step of steps) {
    // Check if step has toolCalls property
    if (step.toolCalls && Array.isArray(step.toolCalls)) {
      for (const toolCall of step.toolCalls) {
        if (toolCall.toolName) {
          const key = `${toolCall.toolCallId || ""}_${toolCall.toolName}`
          if (!toolCallsMap.has(key)) {
            toolCallsMap.set(key, {
              toolName: toolCall.toolName,
            })
          }
        }
      }
    }

    // Also check response.messages for tool call parts
    if (step.response?.messages && Array.isArray(step.response.messages)) {
      for (const message of step.response.messages) {
        if (message.role === "assistant" && message.content && Array.isArray(message.content)) {
          for (const part of message.content) {
            if (part.type === "tool-call" && part.toolName) {
              const key = `${part.toolCallId || ""}_${part.toolName}`
              if (!toolCallsMap.has(key)) {
                toolCallsMap.set(key, {
                  toolName: part.toolName,
                })
              }
            }
          }
        }
      }
    }
  }

  return Array.from(toolCallsMap.values())
}

/**
 * Match tool calls to MCP server IDs by looking up URLs in the database
 */
async function matchToolCallsToServerIds(
  toolCalls: ToolCallInfo[],
  toolToServerUrl: Map<string, string>,
): Promise<Array<{ toolName: string; mcpServerId: string | null }>> {
  const result: Array<{ toolName: string; mcpServerId: string | null }> = []

  for (const toolCall of toolCalls) {
    let mcpServerId: string | null = null

    const serverUrl = toolToServerUrl.get(toolCall.toolName)

    if (serverUrl) {
      const mcpServer = await prisma.mcpServer.findFirst({
        where: { url: serverUrl },
        select: { id: true },
      })

      if (mcpServer) {
        mcpServerId = mcpServer.id
      }
    }

    result.push({
      toolName: toolCall.toolName,
      mcpServerId,
    })
  }

  return result
}

/**
 * Log chat message usage and tool calls to the database
 * This function respects privacy by only logging metadata (usage stats and tool names)
 * without storing message content, inputs, or outputs
 */
export async function logChatMessage(
  userId: string | undefined,
  steps: any[],
  usage: LanguageModelUsage,
  toolToServerUrl: Map<string, string>,
  modelName?: string,
): Promise<void> {
  try {
    const toolCalls = extractToolCallsFromSteps(steps)
    const toolCallsWithServerIds = await matchToolCallsToServerIds(toolCalls, toolToServerUrl)

    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId: userId || null,
        modelName: modelName || null,
        inputTokens: usage.inputTokens || 0,
        totalTokens: usage.totalTokens || 0,
        reasoningTokens: usage.outputTokenDetails?.reasoningTokens || 0,
        cachedInputTokens: usage.inputTokenDetails?.cacheReadTokens || 0,
      },
    })

    if (toolCallsWithServerIds.length > 0) {
      await prisma.chatMessageToolCalls.createMany({
        data: toolCallsWithServerIds.map((tc) => ({
          chatMessageId: chatMessage.id,
          toolName: tc.toolName,
          mcpServerId: tc.mcpServerId,
        })),
      })
    }
  } catch (error) {
    console.error("Failed to log chat message:", error)
  }
}
