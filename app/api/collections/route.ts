import { createAuthHandler } from "@/lib/auth"
import { createCollection } from "@/lib/collections"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { getRequestContext, logger } from "@/lib/monitoring"
import { checkUserRateLimit, createRateLimitError, RATE_LIMITS } from "@/lib/rate-limiting"
import { NextRequest } from "next/server"
import { z } from "zod"

// Enhanced collection validation schema
const collectionSchema = z.object({
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

export const POST = createAuthHandler(async (request: NextRequest, user) => {
  const context = getRequestContext(request)
  logger.apiRequest("POST", "/api/collections", { ...context, userId: user.id })

  try {
    // Check rate limit
    const rateLimitResult = await checkUserRateLimit(user.id, RATE_LIMITS.COLLECTIONS)
    if (!rateLimitResult.allowed) {
      logger.warn("Collection rate limit exceeded", { userId: user.id, ...rateLimitResult })
      return createRateLimitError(rateLimitResult)
    }

    const body = await request.json()

    // Validate with enhanced schema
    const validatedData = collectionSchema.parse(body)

    const collection = await createCollection({
      name: validatedData.name,
      description: validatedData.description,
      keywords: validatedData.keywords,
      isPublic: validatedData.isPublic,
      ownerId: user.id,
    })

    logger.info("Collection created", { collectionId: collection.id, userId: user.id })

    return createSuccessResponse({ success: true, collection }, 201)
  } catch (error) {
    logger.error("Failed to create collection", error as Error, { userId: user.id })
    return createErrorResponse(error, "Failed to create collection")
  }
})
