import { getMCPServerWithReviews } from "@/lib/registry"
import {
  createSuccessResponse,
  createBadRequestResponse,
  createNotFoundResponse,
  createServerErrorResponse,
} from "@/lib/api-response"
import { NextRequest } from "next/server"

/**
 * GET /api/v1/registry/[identifier]
 *
 * Returns detailed information about a specific MCP server.
 *
 * Returns:
 * - Basic server information
 * - All reviews with author details
 * - GitHub README content
 * - GitHub stars count
 * - Tools information
 *
 * This is a public read-only endpoint.
 *
 * @param identifier - The unique identifier of the MCP server (e.g., "owner/repo")
 *                    Captured as path segments and joined together
 * @returns Detailed MCP server information or 404 if not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ identifier: string[] }> }) {
  try {
    const { identifier: identifierSegments } = await params

    if (!identifierSegments || identifierSegments.length === 0) {
      return createBadRequestResponse("Server identifier is required", "v1")
    }

    const identifier = identifierSegments.join("/")

    if (!identifier) {
      return createBadRequestResponse("Server identifier is required", "v1")
    }

    const serverData = await getMCPServerWithReviews(identifier)

    if (!serverData) {
      return createNotFoundResponse("MCP server not found", "v1")
    }

    return createSuccessResponse(serverData, { version: "v1" })
  } catch (error) {
    console.error("Error fetching MCP server details:", error)
    return createServerErrorResponse("Failed to fetch MCP server details", "v1")
  }
}
