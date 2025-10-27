import { auth } from "@/auth"
import { getCollectionsForServer } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ serverId: string }> }) {
  try {
    const { serverId } = await params

    // Validate serverId format (basic validation)
    if (!serverId || serverId.trim().length === 0) {
      return NextResponse.json({ error: "Invalid server ID" }, { status: 400 })
    }

    // Check if the server exists
    const serverExists = await prisma.mcpServer.findFirst({
      where: {
        OR: [{ id: serverId }, { identifier: serverId }],
      },
      select: { id: true }, // Only select id to minimize data transfer
    })

    if (!serverExists) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    const session = await auth()

    // Get public collections and user's private collections if authenticated
    const collections = await getCollectionsForServer(
      serverId,
      !!session?.user?.id, // includePrivate if user is authenticated
      session?.user?.id,
    )

    return NextResponse.json({ collections })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
