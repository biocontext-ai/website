import { createAuthHandler } from "@/lib/auth"
import { deleteMCPServer } from "@/lib/registry"
import { NextRequest, NextResponse } from "next/server"

// DELETE /api/registry/[id] - Delete an MCP server (admin only)
export const DELETE = createAuthHandler(
  async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    try {
      const serverId = (await context.params).id

      if (!serverId) {
        return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
      }

      await deleteMCPServer(serverId)
      return NextResponse.json({ message: "MCP server deleted successfully" })
    } catch (error) {
      console.error("Error deleting MCP server:", error)
      return NextResponse.json({ error: "Failed to delete MCP server" }, { status: 500 })
    }
  },
  true, // Require admin access
)
