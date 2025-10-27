import { createAuthHandler, deleteUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export const DELETE = createAuthHandler(async (request: NextRequest, user) => {
  try {
    if (!user.id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await deleteUser(user.id)
    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
})
