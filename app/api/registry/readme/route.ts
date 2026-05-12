import { isCronRequest } from "@/lib/cron"
import { env } from "@/lib/env"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { fetchGitLabComReadme } from "@/lib/gitlab-com-readme"
import { prisma } from "@/lib/prisma"
import { codeRepositoryHost, parseGitHubComRepoUrl, parseGitLabComProjectPath } from "@/lib/repo-code-host-url"
import type { ReadmePayload } from "@/lib/repo-readme-cron"
import { MCP_SERVER_REPO_README_CRON_WHERE, persistFetchedReadme, shouldUpdateReadme } from "@/lib/repo-readme-cron"
import { Octokit } from "@octokit/rest"
import { connection, NextRequest, NextResponse } from "next/server"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export async function GET(request: NextRequest) {
  await connection()

  try {
    if (!isCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting repository README update job...")

    const mcpServers = await prisma.mcpServer.findMany({
      where: MCP_SERVER_REPO_README_CRON_WHERE,
      include: {
        githubReadme: true,
      },
    })

    console.log(`Found ${mcpServers.length} MCP servers with GitHub or GitLab.com repositories`)

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    const gitlabToken = env.GITLAB_TOKEN

    for (const server of mcpServers) {
      const repoUrl = server.codeRepository
      if (!repoUrl) {
        continue
      }

      try {
        const existingReadme = server.githubReadme
        if (existingReadme && !shouldUpdateReadme(existingReadme.lastChecked)) {
          console.log(`Skipping ${server.identifier} — updated recently`)
          skippedCount++
          continue
        }

        const host = codeRepositoryHost(repoUrl)
        if (host === "github.com") {
          const githubParts = parseGitHubComRepoUrl(repoUrl)
          if (!githubParts) {
            console.warn(`Could not parse GitHub URL for ${server.identifier}: ${repoUrl}`)
            errorCount++
            continue
          }

          console.log(`Fetching README for ${githubParts.owner}/${githubParts.repo}`)

          const { data: readmeData } = await octokit.rest.repos.getReadme({
            owner: githubParts.owner,
            repo: githubParts.repo,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          })

          const payload: ReadmePayload = {
            content: readmeData.content,
            encoding: readmeData.encoding,
            sha: readmeData.sha,
            size: readmeData.size,
          }

          const readmeBodyUpdated = await persistFetchedReadme(server.id, existingReadme, payload)

          console.log(
            readmeBodyUpdated
              ? `Updated README for ${server.identifier} (${readmeData.size} bytes)`
              : `README content unchanged for ${server.identifier}`,
          )
          if (readmeBodyUpdated) updatedCount++
          else skippedCount++

          await new Promise((resolve) => setTimeout(resolve, 100))
          continue
        }

        if (host === "gitlab.com") {
          const glPath = parseGitLabComProjectPath(repoUrl)
          if (!glPath) {
            console.warn(`Could not parse GitLab.com URL for ${server.identifier}: ${repoUrl}`)
            errorCount++
            continue
          }

          console.log(`Fetching README for GitLab.com project ${glPath}`)

          const readmeData = await fetchGitLabComReadme(repoUrl, gitlabToken)
          if (!readmeData) {
            console.warn(`README not found or inaccessible: ${repoUrl}`)
            errorCount++
            continue
          }

          const payload: ReadmePayload = {
            content: readmeData.content,
            encoding: readmeData.encoding,
            sha: readmeData.sha,
            size: readmeData.size,
          }

          const readmeBodyUpdated = await persistFetchedReadme(server.id, existingReadme, payload)

          console.log(
            readmeBodyUpdated
              ? `Updated README for ${server.identifier} (${readmeData.size} bytes)`
              : `README content unchanged for ${server.identifier}`,
          )
          if (readmeBodyUpdated) updatedCount++
          else skippedCount++

          await new Promise((resolve) => setTimeout(resolve, 100))
          continue
        }
      } catch (error: unknown) {
        console.error(`Error updating README for ${server.identifier}:`, error)

        const err = error as { status?: number; response?: { headers?: Record<string, string> } }
        if (err.status === 403 && err.response?.headers?.["x-ratelimit-remaining"] === "0") {
          const resetTime = err.response.headers["x-ratelimit-reset"]
          const resetDate = new Date(parseInt(resetTime ?? "0", 10) * 1000)
          console.log(`Rate limit exceeded. Resets at: ${resetDate.toISOString()}`)
          break
        }

        if (err.status === 404) {
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

    console.log("Repository README update job completed:", summary)

    return createSuccessResponse({
      success: true,
      message: "Repository README update completed",
      ...summary,
    })
  } catch (error) {
    return createErrorResponse(error, "Failed to update repository README data")
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
