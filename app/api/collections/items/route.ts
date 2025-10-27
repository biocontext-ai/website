import { createAuthHandler } from "@/lib/auth"
import { addToCollections, getOrCreateDefaultCollection, removeFromCollection } from "@/lib/collections"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { logger } from "@/lib/monitoring"
import { prisma } from "@/lib/prisma"
import { isCollectionItemRequest } from "@/types/api"
import { NextRequest } from "next/server"

// Add MCP server to collections
export const POST = createAuthHandler(async (request: NextRequest, user) => {
  logger.apiRequest("POST", "/api/collections/items")

  try {
    const body = await request.json()

    if (!isCollectionItemRequest(body)) {
      return createErrorResponse("Invalid request format")
    }

    const { mcpServerId, collectionIds, notes } = body

    if (!mcpServerId) {
      return createErrorResponse("MCP server ID is required")
    }

    // Find the MCP server by identifier or ID
    const mcpServer = await prisma.mcpServer.findFirst({
      where: {
        OR: [{ id: mcpServerId }, { identifier: mcpServerId }],
      },
    })

    if (!mcpServer) {
      return createErrorResponse("MCP server not found")
    }

    let finalCollectionIds = collectionIds

    // If no collections specified, add to default collection
    if (!collectionIds || collectionIds.length === 0) {
      const defaultCollection = await getOrCreateDefaultCollection(user.id)
      finalCollectionIds = [defaultCollection.id]
    }

    // Verify user owns all specified collections
    const collections = await prisma.collection.findMany({
      where: {
        id: { in: finalCollectionIds },
        ownerId: user.id,
      },
    })

    if (collections.length !== finalCollectionIds.length) {
      return createErrorResponse("Some collections not found or not owned by user")
    }

    const items = await addToCollections({
      mcpServerId: mcpServer.id, // Use the actual DB ID
      collectionIds: finalCollectionIds,
      notes,
    })

    logger.info("Added server to collections", {
      userId: user.id,
      mcpServerId: mcpServer.id,
      collectionCount: finalCollectionIds.length,
    })

    return createSuccessResponse({ items })
  } catch (error) {
    logger.error("Failed to add server to collections", error instanceof Error ? error : new Error(String(error)), {
      userId: user.id,
    })
    return createErrorResponse(error, "Failed to add server to collections")
  }
})

// Remove MCP server from collection
export const DELETE = createAuthHandler(async (request: NextRequest, user) => {
  logger.apiRequest("DELETE", "/api/collections/items")

  try {
    const url = new URL(request.url)
    const mcpServerId = url.searchParams.get("mcpServerId")
    const collectionId = url.searchParams.get("collectionId")

    if (!mcpServerId || !collectionId) {
      return createErrorResponse("MCP server ID and collection ID are required")
    }

    // Verify user owns the collection
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        ownerId: user.id,
      },
    })

    if (!collection) {
      return createErrorResponse("Collection not found or not owned by user")
    }

    await removeFromCollection({
      mcpServerId,
      collectionId,
    })

    logger.info("Removed server from collection", {
      userId: user.id,
      mcpServerId,
      collectionId,
    })

    return createSuccessResponse({ success: true })
  } catch (error) {
    logger.error("Failed to remove server from collection", error instanceof Error ? error : new Error(String(error)), {
      userId: user.id,
    })
    return createErrorResponse(error, "Failed to remove server from collection")
  }
})
