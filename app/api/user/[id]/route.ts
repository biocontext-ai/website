import { createAuthHandler, deleteUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

// DELETE /api/user/[id] - Delete a user (admin only)
export const DELETE = createAuthHandler(
  async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    try {
      const userId = (await context.params).id

      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 })
      }

      // Prevent admin from deleting themselves
      if (userId === user.id) {
        return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 })
      }

      await deleteUser(userId)
      return NextResponse.json({ message: "User deleted successfully" })
    } catch (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }
  },
  true, // Require admin access
)
