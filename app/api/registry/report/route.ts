import { auth } from "@/auth"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { logger } from "@/lib/monitoring"
import { prisma } from "@/lib/prisma"
import {
  checkIpRateLimit,
  checkUserRateLimit,
  createRateLimitError,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/rate-limiting"
import { NextRequest } from "next/server"
import { z } from "zod"

const reportApiSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(100, "Reason must be 100 characters or less"),
  explanation: z
    .string()
    .min(10, "Explanation must be at least 10 characters")
    .max(1000, "Explanation must be 1000 characters or less"),
  identifier: z.string().nonempty("Identifier is required"),
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth()
    const userId = session?.user?.id

    // Apply rate limiting
    let rateLimitResult
    if (userId) {
      // Authenticated users get higher limit
      rateLimitResult = await checkUserRateLimit(userId, RATE_LIMITS.REPORTS_AUTHENTICATED)
    } else {
      // Unauthenticated users get stricter limit based on IP
      const ipAddress = getClientIp(request)
      rateLimitResult = await checkIpRateLimit(ipAddress, RATE_LIMITS.REPORTS_UNAUTHENTICATED)
    }

    if (!rateLimitResult.allowed) {
      logger.warn("Report rate limit exceeded", {
        userId: userId || "unauthenticated",
        ip: getClientIp(request),
        ...rateLimitResult,
      })
      return createRateLimitError(rateLimitResult)
    }

    const payload = reportApiSchema.parse(await request.json())

    // Get MCP server by id
    const decodedIdentifier = decodeURIComponent(payload.identifier)

    const server = await prisma.mcpServer.findUnique({
      where: {
        identifier: decodedIdentifier,
      },
    })

    if (!server) {
      return createErrorResponse("No MCP server with this id found.")
    }

    // Check global report limit for this server (10 per day)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const recentReportsCount = await prisma.mcpServerReport.count({
      where: {
        mcpServerId: server.id,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    })

    if (recentReportsCount >= 10) {
      logger.warn("Global report limit exceeded for server", {
        serverId: server.id,
        identifier: decodedIdentifier,
        recentReportsCount,
      })
      return createErrorResponse(
        "This server has received the maximum number of reports for today. Please try again later.",
      )
    }

    // Add report
    await prisma.mcpServerReport.create({
      data: {
        mcpServerId: server.id,
        reason: payload.reason,
        explanation: payload.explanation,
      },
    })

    logger.info("MCP server reported", {
      serverId: server.id,
      identifier: decodedIdentifier,
      userId: userId || "unauthenticated",
      ip: getClientIp(request),
    })

    return createSuccessResponse({
      message: "MCP server is reported.",
    })
  } catch (error) {
    logger.error("Failed to report MCP server", error as Error)
    return createErrorResponse(error, "Failed to report MCP server.")
  }
}
