import "server-only"

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type ReadmePayload = {
  content: string
  encoding: string
  sha: string
  size: number
}

const GIT_PREFIXES = ["https://github.com/", "http://github.com/", "git@github.com:", "ssh://git@github.com/"] as const
const GL_PREFIXES = ["https://gitlab.com/", "http://gitlab.com/", "git@gitlab.com:", "ssh://git@gitlab.com/"] as const

export const MCP_SERVER_REPO_README_CRON_WHERE = {
  OR: [
    ...GIT_PREFIXES.map((p): Prisma.McpServerWhereInput => ({ codeRepository: { startsWith: p } })),
    ...GL_PREFIXES.map((p): Prisma.McpServerWhereInput => ({ codeRepository: { startsWith: p } })),
  ],
}

export function shouldUpdateReadme(lastChecked: Date | null): boolean {
  if (!lastChecked) return true

  const twelveHoursAgo = new Date()
  twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12)

  return lastChecked < twelveHoursAgo
}

export async function persistFetchedReadme(
  mcpServerId: string,
  existingReadme: { sha: string | null } | null | undefined,
  data: ReadmePayload,
): Promise<boolean> {
  if (existingReadme?.sha === data.sha) {
    await prisma.gitHubReadme.update({
      where: { mcpServerId },
      data: { lastChecked: new Date() },
    })
    return false
  }

  await prisma.gitHubReadme.upsert({
    where: { mcpServerId },
    update: {
      content: data.content,
      encoding: data.encoding,
      sha: data.sha,
      size: data.size,
      lastChecked: new Date(),
    },
    create: {
      mcpServerId,
      content: data.content,
      encoding: data.encoding,
      sha: data.sha,
      size: data.size,
      lastChecked: new Date(),
    },
  })
  return true
}
