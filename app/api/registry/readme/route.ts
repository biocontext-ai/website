import { isCronRequest } from "@/lib/cron"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { prisma } from "@/lib/prisma"
import { Octokit } from "@octokit/rest"
import { NextRequest, NextResponse } from "next/server"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// Helper function to extract owner and repo from GitHub URL
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const patterns = [
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
      /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return { owner: match[1], repo: match[2] }
      }
    }
    return null
  } catch (error) {
    console.error("Error parsing GitHub URL:", error)
    return null
  }
}

// Helper function to check if we should update README (not updated in last 12 hours)
function shouldUpdateReadme(lastChecked: Date | null): boolean {
  if (!lastChecked) return true

  const twelveHoursAgo = new Date()
  twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12)

  return lastChecked < twelveHoursAgo
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add authentication)
    if (!isCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting GitHub README update job...")

    // Get all MCP servers with GitHub repository URLs
    const mcpServers = await prisma.mcpServer.findMany({
      where: {
        codeRepository: {
          contains: "github.com",
        },
      },
      include: {
        githubReadme: true,
      },
    })

    console.log(`Found ${mcpServers.length} MCP servers with GitHub repositories`)

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const server of mcpServers) {
      try {
        // Check if we need to update README for this server
        const existingReadme = server.githubReadme
        if (existingReadme && !shouldUpdateReadme(existingReadme.lastChecked)) {
          console.log(`Skipping ${server.identifier} - updated recently`)
          skippedCount++
          continue
        }

        // Parse GitHub URL to get owner and repo
        const githubInfo = parseGitHubUrl(server.codeRepository)
        if (!githubInfo) {
          console.warn(`Could not parse GitHub URL for ${server.identifier}: ${server.codeRepository}`)
          errorCount++
          continue
        }

        console.log(`Fetching README for ${githubInfo.owner}/${githubInfo.repo}`)

        // Get README content
        const { data: readmeData } = await octokit.rest.repos.getReadme({
          owner: githubInfo.owner,
          repo: githubInfo.repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        })

        // Only update if content has changed (compare SHA)
        if (existingReadme && existingReadme.sha === readmeData.sha) {
          console.log(`README content unchanged for ${server.identifier}`)

          // Update lastChecked timestamp even if content hasn't changed
          await prisma.gitHubReadme.update({
            where: {
              mcpServerId: server.id,
            },
            data: {
              lastChecked: new Date(),
            },
          })

          skippedCount++
          continue
        }

        // Update or create GitHub README record
        await prisma.gitHubReadme.upsert({
          where: {
            mcpServerId: server.id,
          },
          update: {
            content: readmeData.content, // Store as base64, decode on display
            encoding: readmeData.encoding,
            sha: readmeData.sha,
            size: readmeData.size,
            lastChecked: new Date(),
          },
          create: {
            mcpServerId: server.id,
            content: readmeData.content, // Store as base64, decode on display
            encoding: readmeData.encoding,
            sha: readmeData.sha,
            size: readmeData.size,
            lastChecked: new Date(),
          },
        })

        console.log(`Updated README for ${server.identifier} (${readmeData.size} bytes)`)
        updatedCount++

        // Add delay to respect GitHub API rate limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`Error updating README for ${server.identifier}:`, error)

        // Handle GitHub API rate limiting
        if (error.status === 403 && error.response?.headers?.["x-ratelimit-remaining"] === "0") {
          const resetTime = error.response.headers["x-ratelimit-reset"]
          const resetDate = new Date(parseInt(resetTime) * 1000)
          console.log(`Rate limit exceeded. Resets at: ${resetDate.toISOString()}`)
          break // Stop processing for now
        }

        // Handle repository not found, access issues, or no README
        if (error.status === 404) {
          console.warn(`README not found or repository private: ${server.codeRepository}`)
        }

        errorCount++
      }
    }

    const summary = {
      totalServers: mcpServers.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    }

    console.log("GitHub README update job completed:", summary)

    return createSuccessResponse({
      success: true,
      message: "GitHub README update completed",
      ...summary,
    })
  } catch (error) {
    return createErrorResponse(error, "Failed to update GitHub README data")
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
