import { isCronRequest } from "@/lib/cron"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { prisma } from "@/lib/prisma"
import { Octokit } from "@octokit/rest"
import { revalidateTag } from "next/cache"
import { connection, NextRequest, NextResponse } from "next/server"

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

// Helper function to check if we should update data (not updated in last 24 hours)
function shouldUpdateData(lastChecked: Date | null): boolean {
  if (!lastChecked) return true

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  return lastChecked < twentyFourHoursAgo
}

export async function GET(request: NextRequest) {
  await connection()
  try {
    // Verify this is an internal request (you might want to add authentication)
    if (!isCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting GitHub data update job...")

    // Get all MCP servers with GitHub repository URLs
    const mcpServers = await prisma.mcpServer.findMany({
      where: {
        codeRepository: {
          contains: "github.com",
        },
      },
      include: {
        githubStars: true,
        githubReadme: true,
      },
    })

    console.log(`Found ${mcpServers.length} MCP servers with GitHub repositories`)

    let starsUpdatedCount = 0
    let readmeUpdatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const server of mcpServers) {
      try {
        // Parse GitHub URL to get owner and repo
        const githubInfo = parseGitHubUrl(server.codeRepository)
        if (!githubInfo) {
          console.warn(`Could not parse GitHub URL for ${server.identifier}: ${server.codeRepository}`)
          errorCount++
          continue
        }

        // Check if we need to update stars
        const existingStars = server.githubStars
        const shouldUpdateStarsData = !existingStars || shouldUpdateData(existingStars.lastChecked)

        // Check if we need to update README
        const existingReadme = server.githubReadme
        const shouldUpdateReadmeData = !existingReadme || shouldUpdateData(existingReadme.lastChecked)

        if (!shouldUpdateStarsData && !shouldUpdateReadmeData) {
          console.log(`Skipping ${server.identifier} - both stars and README updated recently`)
          skippedCount++
          continue
        }

        console.log(`Processing ${githubInfo.owner}/${githubInfo.repo}`)

        // Fetch stars if needed
        if (shouldUpdateStarsData) {
          console.log(`Fetching stars for ${githubInfo.owner}/${githubInfo.repo}`)

          const { data: repoData } = await octokit.rest.repos.get({
            owner: githubInfo.owner,
            repo: githubInfo.repo,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          })

          const starCount = repoData.stargazers_count

          // Update or create GitHub stars record
          await prisma.gitHubStars.upsert({
            where: {
              mcpServerId: server.id,
            },
            update: {
              starCount,
              lastChecked: new Date(),
            },
            create: {
              mcpServerId: server.id,
              starCount,
              lastChecked: new Date(),
            },
          })

          console.log(`Updated ${server.identifier}: ${starCount} stars`)
          starsUpdatedCount++
        }

        // Fetch README if needed
        if (shouldUpdateReadmeData) {
          console.log(`Fetching README for ${githubInfo.owner}/${githubInfo.repo}`)

          try {
            const { data: readmeData } = await octokit.rest.repos.getReadme({
              owner: githubInfo.owner,
              repo: githubInfo.repo,
              headers: {
                "X-GitHub-Api-Version": "2022-11-28",
              },
            })

            // Update or create GitHub README record
            await prisma.gitHubReadme.upsert({
              where: {
                mcpServerId: server.id,
              },
              update: {
                content: readmeData.content,
                encoding: readmeData.encoding,
                sha: readmeData.sha,
                size: readmeData.size,
                lastChecked: new Date(),
              },
              create: {
                mcpServerId: server.id,
                content: readmeData.content,
                encoding: readmeData.encoding,
                sha: readmeData.sha,
                size: readmeData.size,
                lastChecked: new Date(),
              },
            })

            console.log(`Updated README for ${server.identifier} (${readmeData.size} bytes)`)
            readmeUpdatedCount++
          } catch (readmeError: any) {
            // README might not exist or be inaccessible
            if (readmeError.status === 404) {
              console.log(`No README found for ${server.identifier}`)
            } else {
              console.warn(`Error fetching README for ${server.identifier}:`, readmeError.message)
            }
          }
        }

        // Add delay to respect GitHub API rate limits
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error: any) {
        console.error(`Error processing ${server.identifier}:`, error)

        // Handle GitHub API rate limiting
        if (error.status === 403 && error.response?.headers?.["x-ratelimit-remaining"] === "0") {
          const resetTime = error.response.headers["x-ratelimit-reset"]
          const resetDate = new Date(parseInt(resetTime) * 1000)
          console.log(`Rate limit exceeded. Resets at: ${resetDate.toISOString()}`)
          break // Stop processing for now
        }

        // Handle repository not found or access issues
        if (error.status === 404) {
          console.warn(`Repository not found or private: ${server.codeRepository}`)
        }

        errorCount++
      }
    }

    const summary = {
      totalServers: mcpServers.length,
      starsUpdated: starsUpdatedCount,
      readmeUpdated: readmeUpdatedCount,
      skipped: skippedCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    }

    console.log("GitHub data update job completed:", summary)

    // Invalidate registry caches when stars/readme data changes
    if (starsUpdatedCount > 0 || readmeUpdatedCount > 0) {
      revalidateTag("registry:list", "max")
      revalidateTag("registry:server", "max")
    }

    return createSuccessResponse({
      success: true,
      message: "GitHub data update completed",
      ...summary,
    })
  } catch (error) {
    return createErrorResponse(error, "Failed to update GitHub stars and README data")
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
