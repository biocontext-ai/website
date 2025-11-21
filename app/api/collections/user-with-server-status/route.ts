import { createAuthHandler } from "@/lib/auth"
import { getUserCollectionsWithServerStatus } from "@/lib/collections"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { logger } from "@/lib/monitoring"
import { connection, NextRequest } from "next/server"

export const GET = createAuthHandler(async (request: NextRequest, user) => {
  await connection()
  logger.apiRequest("GET", "/api/collections/user-with-server-status")

  try {
    const url = new URL(request.url)
    const mcpServerId = url.searchParams.get("mcpServerId")

    if (!mcpServerId) {
      return createErrorResponse("MCP server ID is required")
    }

    const collections = await getUserCollectionsWithServerStatus(user.id, mcpServerId)

    logger.info("Retrieved user collections with server status", {
      userId: user.id,
      mcpServerId,
      collectionCount: collections.length,
    })
    return createSuccessResponse({ collections })
  } catch (error) {
    logger.error(
      "Failed to fetch user collections with server status",
      error instanceof Error ? error : new Error(String(error)),
      { userId: user.id },
    )
    return createErrorResponse(error, "Failed to fetch user collections with server status")
  }
})
