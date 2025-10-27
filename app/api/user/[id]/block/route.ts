import { blockUser, createAuthHandler, unblockUser } from "@/lib/auth"
import { isBlockUserRequest } from "@/types/api"
import { NextRequest, NextResponse } from "next/server"

// PATCH /api/user/[id]/block - Block a user (admin only)
export const PATCH = createAuthHandler(
  async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    try {
      const requestBody = await request.json()

      if (!isBlockUserRequest(requestBody)) {
        return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
      }

      const { action } = requestBody
      const userId = (await context.params).id

      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 })
      }

      // Prevent admin from blocking themselves
      if (userId === user.id) {
        return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 })
      }

      if (action === "block") {
        await blockUser(userId)
        return NextResponse.json({ message: "User blocked successfully" })
      } else if (action === "unblock") {
        await unblockUser(userId)
        return NextResponse.json({ message: "User unblocked successfully" })
      } else {
        return NextResponse.json({ error: "Invalid action. Use 'block' or 'unblock'" }, { status: 400 })
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
    }
  },
  true, // Require admin access
)
