import { env } from "@/lib/env"
import { logger } from "@/lib/monitoring"
import "server-only"

export async function sendStreamMessage(stream: string, topic: string, content: string) {
  try {
    if (!env.ZULIP_USERNAME || !env.ZULIP_API_KEY || !env.ZULIP_REALM) {
      logger.warn("Zulip credentials not configured, skipping post")
      return false
    }

    const realmUrl = env.ZULIP_REALM.replace(/\/$/, "") // Remove trailing slash
    const apiUrl = `${realmUrl}/api/v1/messages`

    // Create Basic Auth header
    const credentials = Buffer.from(`${env.ZULIP_USERNAME}:${env.ZULIP_API_KEY}`).toString("base64")

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        type: "stream",
        to: stream,
        topic: topic,
        content: content,
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    logger.info("Successfully posted to Zulip", { stream, topic })
    return true
  } catch (error) {
    logger.error("Failed to send Zulip stream message", error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

export async function sendDirectMessage(to: string | string[], content: string) {
  try {
    if (!env.ZULIP_USERNAME || !env.ZULIP_API_KEY || !env.ZULIP_REALM) {
      logger.warn("Zulip credentials not configured, skipping post")
      return false
    }

    const realmUrl = env.ZULIP_REALM.replace(/\/$/, "")
    const apiUrl = `${realmUrl}/api/v1/messages`

    const credentials = Buffer.from(`${env.ZULIP_USERNAME}:${env.ZULIP_API_KEY}`).toString("base64")

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        type: "private",
        to: Array.isArray(to) ? to.join(",") : to,
        content: content,
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    logger.info("Successfully posted direct message to Zulip")
    return true
  } catch (error) {
    logger.error("Failed to send Zulip direct message", error instanceof Error ? error : new Error(String(error)))
    return false
  }
}
