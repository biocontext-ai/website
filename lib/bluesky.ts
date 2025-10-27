import { logger } from "@/lib/monitoring"
import { RegistryUpdateResult } from "@/types/api"
import { AtpAgent, RichText } from "@atproto/api"
import "server-only"

let cachedAgent: AtpAgent | null = null

async function getAtpAgent(): Promise<AtpAgent | null> {
  try {
    const username = process.env.BLUESKY_USERNAME
    const password = process.env.BLUESKY_PASSWORD

    if (!username || !password) {
      logger.warn("Bluesky credentials not configured")
      return null
    }

    if (!cachedAgent) {
      cachedAgent = new AtpAgent({
        service: "https://bsky.social",
      })

      await cachedAgent.login({
        identifier: username,
        password: password,
      })
    }

    return cachedAgent
  } catch (error) {
    logger.error("Failed to initialize AtpAgent", error instanceof Error ? error : new Error(String(error)))
    cachedAgent = null
    return null
  }
}

export async function postToBluesky(post: { text: string }): Promise<boolean> {
  if (process.env.NODE_ENV == "development") {
    // Disable bluesky update in dev mode
    logger.info("Bluesky posts are skipped in development mode.")
    return true
  }

  try {
    const agent = await getAtpAgent()

    if (!agent) {
      return false
    }

    const richText = new RichText({ text: post.text })
    await richText.detectFacets(agent)

    await agent.post({
      text: richText.text,
      facets: richText.facets,
    })

    logger.info("Successfully posted to Bluesky")
    return true
  } catch (error) {
    logger.error("Failed to post to Bluesky", error instanceof Error ? error : new Error(String(error)))
    // Reset cached agent on error in case the session expired
    cachedAgent = null
    return false
  }
}

export function generateMcpServerPost(server: RegistryUpdateResult): string {
  const text = `🤖🧬 New biomedical MCP server added to the registry:
${server.name || server.identifier}
Check it out at https://biocontext.ai/registry/${server.identifier}`

  return text
}

export function generateMcpServerMessage(server: RegistryUpdateResult): string {
  return `🤖🧬 **New MCP Server Added**\n\n**Name:** ${server.name || server.identifier}\n\n**Link:** https://biocontext.ai/registry/${server.identifier}`
}
