import { getAvailableMcpServers } from "@/lib/registry"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const servers = await getAvailableMcpServers()
    return NextResponse.json(servers)
  } catch (error) {
    console.error("Error fetching MCP servers:", error)
    return NextResponse.json({ error: "Failed to fetch MCP servers" }, { status: 500 })
  }
}
