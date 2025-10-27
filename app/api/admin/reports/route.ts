import { createAuthHandler } from "@/lib/auth"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { getRequestContext, logger } from "@/lib/monitoring"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

// Get all MCP server reports (admin only)
export const GET = createAuthHandler(async (request: NextRequest, user) => {
  const context = getRequestContext(request)
  logger.apiRequest("GET", "/api/admin/reports", { ...context, userId: user.id })

  try {
    const reports = await prisma.mcpServerReport.findMany({
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
    return createSuccessResponse({
      reports,
    })
  } catch (error) {
    logger.error("Failed to fetch reports", error as Error, { userId: user.id })
    return createErrorResponse("Failed to get reports from database.")
  }
}, true)
