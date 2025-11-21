import { createAuthHandler } from "@/lib/auth"
import { getUserCollections } from "@/lib/collections"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { logger } from "@/lib/monitoring"
import { connection, NextRequest } from "next/server"

export const GET = createAuthHandler(async (request: NextRequest, user) => {
  await connection()
  logger.apiRequest("GET", "/api/collections/user")

  try {
    const collections = await getUserCollections(user.id)

    logger.info("Retrieved user collections", { userId: user.id, collectionCount: collections.length })
    return createSuccessResponse({ collections })
  } catch (error) {
    logger.error("Failed to fetch user collections", error instanceof Error ? error : new Error(String(error)), {
      userId: user.id,
    })
    return createErrorResponse(error, "Failed to fetch user collections")
  }
})
