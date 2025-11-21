import { getOptionalAuth, isUserAdmin } from "@/lib/auth"
import { createSuccessResponse } from "@/lib/error-handling"
import { logger } from "@/lib/monitoring"
import { connection, NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  await connection()
  logger.apiRequest("GET", "/api/user/admin-status")

  try {
    const user = await getOptionalAuth(request)

    if (!user?.id) {
      return createSuccessResponse({ isAdmin: false })
    }

    const adminStatus = await isUserAdmin(user.id)

    logger.info("Checked admin status", { userId: user.id, isAdmin: adminStatus })
    return createSuccessResponse({ isAdmin: adminStatus })
  } catch (error) {
    logger.error("Failed to check admin status", error instanceof Error ? error : new Error(String(error)))
    return createSuccessResponse({ isAdmin: false })
  }
}
