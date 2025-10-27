import { createServerErrorResponse, createSuccessResponse } from "@/lib/api-response"
import { getAllMCPServers } from "@/lib/registry"

/**
 * GET /api/v1/registry
 *
 * Returns a list of all MCP servers from the registry.
 * This is a public read-only endpoint.
 *
 * @returns Array of MCP servers with basic information and review summaries
 */
export async function GET() {
  try {
    const servers = await getAllMCPServers()

    return createSuccessResponse(servers, {
      version: "v1",
      total: servers.length,
    })
  } catch (error) {
    console.error("Error fetching MCP servers:", error)
    return createServerErrorResponse("Failed to fetch MCP servers", "v1")
  }
}
