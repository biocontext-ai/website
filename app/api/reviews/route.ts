import { createAuthHandler } from "@/lib/auth"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { getRequestContext, logger } from "@/lib/monitoring"
import { checkUserRateLimit, createRateLimitError, RATE_LIMITS } from "@/lib/rate-limiting"
import { addReview, deleteReview, hasUserReviewed, updateReview } from "@/lib/registry"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schema for review submissions
const reviewSchema = z.object({
  name: z.string().min(1, "Review title is required").max(100, "Review title must be 100 characters or less"),
  reviewBody: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review must be 2000 characters or less"),
  isHelpful: z.boolean(), // True for thumbs up, false for thumbs down
  mcpServerId: z.string().min(1, "MCP Server ID is required"),
})

export const POST = createAuthHandler(async (request: NextRequest, user) => {
  const context = getRequestContext(request)
  logger.apiRequest("POST", "/api/reviews", { ...context, userId: user.id })

  try {
    // Check rate limit
    const rateLimitResult = await checkUserRateLimit(user.id, RATE_LIMITS.REVIEWS)
    if (!rateLimitResult.allowed) {
      logger.warn("Review rate limit exceeded", { userId: user.id, ...rateLimitResult })
      return createRateLimitError(rateLimitResult)
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Check if user has already reviewed this server
    const existingReview = await hasUserReviewed(user.id, validatedData.mcpServerId)

    let review
    let isUpdate = false

    if (existingReview) {
      // Update existing review
      review = await updateReview(existingReview.id, {
        name: validatedData.name,
        reviewBody: validatedData.reviewBody,
        isHelpful: validatedData.isHelpful,
      })
      isUpdate = true
      logger.info("Review updated", { reviewId: review.id, userId: user.id })
    } else {
      // Create new review
      review = await addReview({
        ...validatedData,
        authorId: user.id,
      })
      logger.info("Review created", { reviewId: review.id, userId: user.id })
    }

    return createSuccessResponse(
      {
        message: isUpdate ? "Review updated successfully" : "Review submitted for approval",
        review: {
          id: review.id,
          name: review.name,
          reviewBody: review.reviewBody,
          isHelpful: review.isHelpful,
          datePublished: review.datePublished,
          isPending: review.isPending,
          isApproved: review.isApproved,
        },
      },
      isUpdate ? 200 : 201,
    )
  } catch (error) {
    logger.error("Failed to create/update review", error as Error, { userId: user.id })
    return createErrorResponse(error, "Failed to process review")
  }
})

export const DELETE = createAuthHandler(async (request: NextRequest, user) => {
  const context = getRequestContext(request)
  logger.apiRequest("DELETE", "/api/reviews", { ...context, userId: user.id })

  try {
    // Get review ID from query parameters
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("id")

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 })
    }

    // Delete the review
    await deleteReview(reviewId, user.id)
    logger.info("Review deleted", { reviewId, userId: user.id })

    return createSuccessResponse({
      message: "Review deleted successfully",
    })
  } catch (error) {
    logger.error("Failed to delete review", error as Error, { userId: user.id })
    return createErrorResponse(error, "Failed to delete review")
  }
})
