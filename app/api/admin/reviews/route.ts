import { createAuthHandler } from "@/lib/auth"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { getRequestContext, logger } from "@/lib/monitoring"
import { approveReview, deleteReviewAndBlockUser, getPendingReviews } from "@/lib/registry"
import { connection, NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schema for review approval actions
const reviewApprovalSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  action: z.enum(["approve", "delete", "delete_and_block"]),
})

// GET /api/admin/reviews - Get all pending reviews (admin only)
export const GET = createAuthHandler(
  async (request: NextRequest, user) => {
    await connection()
    const context = getRequestContext(request)
    logger.apiRequest("GET", "/api/admin/reviews", { ...context, userId: user.id })

    try {
      const reviews = await getPendingReviews()

      return createSuccessResponse({
        reviews: reviews.map((review) => ({
          id: review.id,
          name: review.name,
          reviewBody: review.reviewBody,
          isHelpful: review.isHelpful,
          datePublished: review.datePublished,
          author: {
            id: review.author.id,
            name: review.author.name,
            email: review.author.email,
            image: review.author.image,
          },
          mcpServer: {
            id: review.mcpServer.id,
            name: review.mcpServer.name,
            identifier: review.mcpServer.identifier,
          },
          isPending: review.isPending,
          isApproved: review.isApproved,
        })),
      })
    } catch (error) {
      logger.error("Failed to fetch pending reviews", error as Error, { userId: user.id })
      return createErrorResponse(error, "Failed to fetch pending reviews")
    }
  },
  true, // Require admin access
)

// POST /api/admin/reviews - Approve, delete, or delete and block user (admin only)
export const POST = createAuthHandler(
  async (request: NextRequest, user) => {
    const context = getRequestContext(request)
    logger.apiRequest("POST", "/api/admin/reviews", { ...context, userId: user.id })

    try {
      const body = await request.json()
      const validatedData = reviewApprovalSchema.parse(body)

      let result
      let message

      switch (validatedData.action) {
        case "approve":
          result = await approveReview(validatedData.reviewId, user.id)
          message = "Review approved successfully"
          logger.info("Review approved by admin", { reviewId: validatedData.reviewId, adminId: user.id })
          break

        case "delete":
          result = await deleteReviewAndBlockUser(validatedData.reviewId, user.id, false)
          message = "Review deleted successfully"
          logger.info("Review deleted by admin", { reviewId: validatedData.reviewId, adminId: user.id })
          break

        case "delete_and_block":
          result = await deleteReviewAndBlockUser(validatedData.reviewId, user.id, true)
          message = `Review deleted and user ${result.reviewAuthor} blocked successfully`
          logger.info("Review deleted and user blocked by admin", {
            reviewId: validatedData.reviewId,
            adminId: user.id,
            blockedUser: result.reviewAuthor,
          })
          break

        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }

      return createSuccessResponse({
        message,
        result,
      })
    } catch (error) {
      logger.error("Failed to process review action", error as Error, { userId: user.id })
      return createErrorResponse(error, "Failed to process review action")
    }
  },
  true, // Require admin access
)
