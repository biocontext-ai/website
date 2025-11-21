import { createAuthHandler } from "@/lib/auth"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { getRequestContext, logger } from "@/lib/monitoring"
import { prisma } from "@/lib/prisma"
import { McpServerStats, PeriodStats, StatsResponse } from "@/types/api"
import { connection, NextRequest } from "next/server"

async function getStatsForPeriod(daysAgo: number): Promise<PeriodStats> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)

  // Get total messages
  const totalMessages = await prisma.chatMessage.count({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  })

  // Get unique users who sent messages
  const uniqueUsers = await prisma.chatMessage.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      userId: {
        not: null,
      },
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  })

  // Get tool calls with MCP server information
  const toolCalls = await prisma.chatMessageToolCalls.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      mcpServerId: {
        not: null,
      },
    },
    include: {
      mcpServer: {
        select: {
          id: true,
          name: true,
          identifier: true,
        },
      },
    },
  })

  // Aggregate by MCP server
  const serverMap = new Map<string, McpServerStats>()

  for (const toolCall of toolCalls) {
    if (!toolCall.mcpServer) continue

    const serverId = toolCall.mcpServer.id
    if (!serverMap.has(serverId)) {
      serverMap.set(serverId, {
        id: toolCall.mcpServer.id,
        name: toolCall.mcpServer.name,
        identifier: toolCall.mcpServer.identifier,
        totalCalls: 0,
        toolCalls: [],
      })
    }

    const serverStats = serverMap.get(serverId)!
    serverStats.totalCalls++

    // Find or create tool call entry
    const existingToolCall = serverStats.toolCalls.find((tc) => tc.toolName === toolCall.toolName)
    if (existingToolCall) {
      existingToolCall.count++
    } else {
      serverStats.toolCalls.push({
        toolName: toolCall.toolName,
        count: 1,
      })
    }
  }

  // Sort servers by total calls (descending)
  const mcpServers = Array.from(serverMap.values()).sort((a, b) => b.totalCalls - a.totalCalls)

  // Sort tool calls within each server by count (descending)
  for (const server of mcpServers) {
    server.toolCalls.sort((a, b) => b.count - a.count)
  }

  const modelUsageData = await prisma.chatMessage.groupBy({
    by: ["modelName"],
    where: {
      createdAt: {
        gte: startDate,
      },
      modelName: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      totalTokens: true,
    },
  })

  const modelUsage = modelUsageData
    .map((item) => ({
      modelName: item.modelName || "unknown",
      totalCalls: item._count.id,
      totalTokens: item._sum.totalTokens || 0,
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls)

  return {
    totalMessages,
    totalUsers: uniqueUsers.length,
    mcpServers,
    modelUsage,
  }
}

export const GET = createAuthHandler(async (request: NextRequest, user) => {
  await connection()
  const context = getRequestContext(request)
  logger.apiRequest("GET", "/api/admin/stats", { ...context, userId: user.id })

  try {
    // Get stats for different time periods
    const [last7Days, last30Days, last365Days] = await Promise.all([
      getStatsForPeriod(7),
      getStatsForPeriod(30),
      getStatsForPeriod(365),
    ])

    const response: StatsResponse = {
      last7Days,
      last30Days,
      last365Days,
    }

    return createSuccessResponse(response)
  } catch (error) {
    // console.error("Error fetching admin stats:", error)
    logger.error("Failed to fetch statistics", error as Error, { userId: user.id })
    return createErrorResponse("Failed to fetch statistics")
  }
}, true)
