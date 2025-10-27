import { prisma } from "@/lib/prisma"
import "server-only"

export async function validateMcpServerUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol !== "https:") {
      return { valid: false, reason: "Only HTTPS protocol is allowed" }
    }

    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsedUrl.hostname)
    const isIPv6 = parsedUrl.hostname.includes(":") && /^[0-9a-f:]+$/i.test(parsedUrl.hostname)

    if (isIPv4 || isIPv6) {
      return { valid: false, reason: "IP addresses are not allowed, only domain names" }
    }

    const port = parsedUrl.port ? parseInt(parsedUrl.port) : 443

    if (port !== 443) {
      return { valid: false, reason: "Only port 443 (or no port specified) is allowed with HTTPS" }
    }

    const normalizedUrl = parsedUrl.toString().replace(/\/$/, "")

    const serverInRegistry = await prisma.mcpServer.findFirst({
      where: {
        url: {
          in: [normalizedUrl, normalizedUrl + "/", url, url.replace(/\/$/, "")],
        },
      },
      select: {
        id: true,
        name: true,
        url: true,
      },
    })

    if (!serverInRegistry) {
      return {
        valid: false,
        reason: "URL not found in registry. Only registered MCP servers are allowed for security.",
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, reason: "Invalid URL format" }
  }
}
