import { createAuthHandler } from "@/lib/auth"
import { deleteCollection, updateCollection } from "@/lib/collections"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { logger } from "@/lib/monitoring"
import { prisma } from "@/lib/prisma"
import { logSecurityEventFromRequest, SecurityEventType } from "@/lib/security-events"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Enhanced collection validation schema (same as in route.ts)
const collectionUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Collection name is required")
    .max(100, "Collection name too long")
    .trim()
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Collection name can only contain letters, numbers, spaces, hyphens, and underscores",
    ),
  description: z
    .string()
    .max(500, "Description too long")
    .optional()
    .transform((val) => val?.trim()),
  keywords: z
    .array(
      z
        .string()
        .min(1)
        .max(30, "Keyword too long")
        .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid keyword format"),
    )
    .max(20, "Maximum 20 keywords allowed")
    .optional()
    .default([]),
  isPublic: z.boolean().optional().default(false),
})

// Update collection
export const PUT = createAuthHandler(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    logger.apiRequest("PUT", "/api/collections/[id]")

    try {
      const { id } = await params
      const body = await request.json()

      // Validate with enhanced schema
      const validatedData = collectionUpdateSchema.parse(body)

      // SECURITY: Verify ownership before update to prevent IDOR
      const existingCollection = await prisma.collection.findUnique({
        where: { id },
        select: { ownerId: true, isDefault: true },
      })

      if (!existingCollection) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 })
      }

      if (existingCollection.ownerId !== user.id) {
        await logSecurityEventFromRequest(request, SecurityEventType.IDOR_ATTEMPT, {
          userId: user.id,
          action: "update_collection",
          success: false,
          metadata: {
            collectionId: id,
            ownerId: existingCollection.ownerId,
          },
        })
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }

      const collection = await updateCollection(id, {
        name: validatedData.name,
        description: validatedData.description,
        keywords: validatedData.keywords,
        isPublic: validatedData.isPublic,
      })

      logger.info("Updated collection", { userId: user.id, collectionId: id })
      return createSuccessResponse({ collection })
    } catch (error) {
      logger.error("Failed to update collection", error instanceof Error ? error : new Error(String(error)), {
        userId: user.id,
      })
      return createErrorResponse(error, "Failed to update collection")
    }
  },
)

// Delete collection
export const DELETE = createAuthHandler(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    logger.apiRequest("DELETE", "/api/collections/[id]")

    try {
      const { id } = await params

      await deleteCollection(id, user.id)

      logger.info("Deleted collection", { userId: user.id, collectionId: id })
      return createSuccessResponse({ success: true })
    } catch (error) {
      logger.error("Failed to delete collection", error instanceof Error ? error : new Error(String(error)), {
        userId: user.id,
      })
      return createErrorResponse(error, "Failed to delete collection")
    }
  },
)
