import { createAuthHandler } from "@/lib/auth"
import { ApiException, createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { getRequestContext, logger } from "@/lib/monitoring"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

// Dismiss a report (admin only)
export const POST = createAuthHandler(
  async (request: NextRequest, user, { params }: { params: Promise<{ reportId: string }> }) => {
    const context = getRequestContext(request)
    logger.apiRequest("POST", `/api/admin/reports/${(await params).reportId}/dismiss`, {
      ...context,
      userId: user.id,
    })

    try {
      const { reportId } = await params

      // Check if report exists
      const report = await prisma.mcpServerReport.findUnique({
        where: { id: reportId },
      })

      if (!report) {
        throw new ApiException(404, { message: "Report not found." })
      }

      // Delete the report (dismissing it)
      await prisma.mcpServerReport.delete({
        where: { id: reportId },
      })

      return createSuccessResponse({
        message: "Report dismissed successfully",
      })
    } catch (error) {
      logger.error("Failed to dismiss report", error as Error, {
        userId: user.id,
        reportId: (await params).reportId,
      })
      return createErrorResponse(error)
    }
  },
  true,
)
