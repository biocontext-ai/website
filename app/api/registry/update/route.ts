import { generateMcpServerMessage, generateMcpServerPost, postToBluesky } from "@/lib/bluesky"
import { verifyCronRequest } from "@/lib/cron"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { logger } from "@/lib/monitoring"
import { prisma } from "@/lib/prisma"
import { sendStreamMessage } from "@/lib/zulip"
import { RegistryUpdateResult } from "@/types/api"
import { ApplicationCategory } from "@prisma/client/index"
import { validate } from "jsonschema"
import { revalidateTag } from "next/cache"
import { connection, NextRequest, NextResponse } from "next/server"

// Define the interface for the MCP server data structure
interface McpServerData {
  "@context": string
  "@type": string
  "@id": string
  "identifier": string
  "name": string
  "description": string
  "codeRepository": string
  "url"?: string
  "softwareHelp"?: {
    "@type": "CreativeWork"
    "url": string
    "name": string
  }
  "maintainer": Array<{
    "@type": "Person" | "Organization"
    "name": string
    "identifier"?: string
    "url"?: string
  }>
  "license": string
  "applicationCategory": (typeof ApplicationCategory)[keyof typeof ApplicationCategory]
  "keywords": string[]
  "datePublished"?: string
  "operatingSystem"?: string[]
  "programmingLanguage": string[]
  "featureList"?: string[]
  "additionalType"?: string[]
}

/**
 * Fetch JSON from a URL with timeout and size limits
 */
async function fetchWithValidation(
  url: string,
  timeoutMs: number = 10000,
  maxSizeBytes: number = 5 * 1024 * 1024, // 5MB
): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Check content length if available
    const contentLength = response.headers.get("content-length")
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new Error(`Response size (${contentLength} bytes) exceeds limit (${maxSizeBytes} bytes)`)
    }

    // Read response with size limit
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("Response body is not readable")
    }

    const chunks: Uint8Array[] = []
    let totalSize = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalSize += value.length
      if (totalSize > maxSizeBytes) {
        reader.cancel()
        throw new Error(`Response size exceeds limit (${maxSizeBytes} bytes)`)
      }

      chunks.push(value)
    }

    // Combine chunks and parse JSON
    const blob = new Blob(chunks as BlobPart[])
    const text = await blob.text()
    const data = JSON.parse(text)

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * Validate that ecosystem data has required schema.org context
 */
function validateEcosystemData(data: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Array.isArray(data)) {
    errors.push("Data is not an array")
    return { valid: false, errors }
  }

  if (data.length === 0) {
    errors.push("Data array is empty")
    return { valid: false, errors }
  }

  // Check each item for required @context
  data.forEach((item, index) => {
    if (!item["@context"] || item["@context"] !== "https://schema.org") {
      errors.push(`Item at index ${index} missing or invalid @context (expected "https://schema.org")`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function POST(request: NextRequest) {
  // Explicitly defer to request time for external API calls
  await connection()

  logger.apiRequest("POST", "/api/registry/update")

  // Verify this is an authenticated cron request
  const isValidCron = await verifyCronRequest(request)

  if (!isValidCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch the schema from biocontext.ai with timeout and size limit
    const schema = await fetchWithValidation("https://biocontext.ai/schema.json", 10000, 5 * 1024 * 1024)

    // Fetch ecosystem data from biocontext.ai with timeout and size limit
    const ecosystemData: McpServerData[] = await fetchWithValidation(
      "https://biocontext.ai/registry.json",
      10000,
      5 * 1024 * 1024,
    )

    // Validate ecosystem data structure
    const validation = validateEcosystemData(ecosystemData)
    if (!validation.valid) {
      logger.error("Ecosystem data validation failed", new Error(validation.errors.join("; ")))
      return createErrorResponse(`Invalid ecosystem data: ${validation.errors.join("; ")}`)
    }

    // Fetch MCP installation configurations with timeout and size limit
    let mcpInstallConfigs: Record<string, any> = {}
    try {
      const mcpJson = await fetchWithValidation("https://biocontext.ai/mcp.json", 10000, 5 * 1024 * 1024)
      mcpInstallConfigs = mcpJson.mcpServers || {}
    } catch (error) {
      logger.warn("Failed to fetch mcp.json, continuing without installation configs", error as Error)
    }

    // Fetch MCP tools data with timeout and size limit
    let mcpToolsData: Record<string, any> = {}
    try {
      const mcpTools = await fetchWithValidation("https://biocontext.ai/mcp_tools.json", 10000, 5 * 1024 * 1024)
      mcpToolsData = mcpTools.mcp_servers || {}
    } catch (error) {
      logger.warn("Failed to fetch mcp_tools.json, continuing without tools data", error as Error)
    }

    const results: RegistryUpdateResult[] = []
    let processedCount = 0
    let errorCount = 0

    logger.info("Starting registry update", { serverCount: ecosystemData.length })

    // Process each MCP server entry
    for (let serverData of ecosystemData) {
      try {
        serverData = {
          ...serverData,
          license: serverData.license.includes("https://")
            ? serverData.license
            : "https://spdx.org/licenses/" + serverData.license,
        }

        const validation = validate(serverData, schema)

        if (!validation.valid) {
          console.error(`Validation failed for ${serverData.identifier}:`, validation.errors)
          errorCount++
          continue
        }

        // Check if server already exists
        const existingServer = await prisma.mcpServer.findUnique({
          where: { identifier: serverData.identifier },
        })

        // Get installation config for this server
        const installationConfig = mcpInstallConfigs[serverData.identifier] || null

        // Get token count from MCP tools data
        const serverToolsInfo = mcpToolsData[serverData.identifier]
        const tokenCount = serverToolsInfo?.token_count ?? null

        // Prepare the data for database insertion/update
        const serverCreateData = {
          context: serverData["@context"],
          type: serverData["@type"],
          uri: serverData["@id"],
          identifier: serverData.identifier,
          name: serverData.name,
          description: serverData.description,
          codeRepository: serverData.codeRepository,
          url: serverData.url || null,
          softwareHelpUrl: serverData.softwareHelp?.url || null,
          softwareHelpName: serverData.softwareHelp?.name || null,
          datePublished: serverData.datePublished ? new Date(serverData.datePublished) : null,
          applicationCategory: serverData.applicationCategory as any,
          license: serverData.license || "Unknown",
          installationConfig: installationConfig,
          tokenCount: tokenCount,
          updatedAt: new Date(),
        }

        let mcpServer
        if (existingServer) {
          // Update existing server with transaction
          mcpServer = await prisma.$transaction(async (tx) => {
            // Update the main server record
            const updatedServer = await tx.mcpServer.update({
              where: { identifier: serverData.identifier },
              data: serverCreateData,
            })

            // Clear existing relations
            await Promise.all([
              tx.mcpServerAdditionalType.deleteMany({
                where: { mcpServerId: updatedServer.id },
              }),
              tx.mcpServerMaintainer.deleteMany({
                where: { mcpServerId: updatedServer.id },
              }),
              tx.mcpServerKeyword.deleteMany({
                where: { mcpServerId: updatedServer.id },
              }),
              tx.mcpServerOperatingSystem.deleteMany({
                where: { mcpServerId: updatedServer.id },
              }),
              tx.mcpServerProgrammingLanguage.deleteMany({
                where: { mcpServerId: updatedServer.id },
              }),
              tx.mcpServerFeature.deleteMany({
                where: { mcpServerId: updatedServer.id },
              }),
              tx.mcpServerTool.deleteMany({
                where: { mcpServerId: updatedServer.id },
              }),
            ])

            return updatedServer
          })
        } else {
          // Create new server
          mcpServer = await prisma.mcpServer.create({
            data: serverCreateData,
          })
        }

        // Create relations in a separate transaction
        await prisma.$transaction(async (tx) => {
          const relationPromises = []

          // Additional types
          if (serverData.additionalType && serverData.additionalType.length > 0) {
            const additionalTypes = serverData.additionalType.map((type) => ({
              mcpServerId: mcpServer.id,
              type:
                type === "https://schema.org/ScholarlyArticle"
                  ? ("ScholarlyArticle" as const)
                  : ("SoftwareSourceCode" as const),
            }))
            relationPromises.push(tx.mcpServerAdditionalType.createMany({ data: additionalTypes }))
          }

          // Maintainers
          if (serverData.maintainer && serverData.maintainer.length > 0) {
            const maintainers = serverData.maintainer.map((maintainer) => ({
              mcpServerId: mcpServer.id,
              type: maintainer["@type"] as "Person" | "Organization",
              name: maintainer.name,
              identifier: maintainer.identifier || null,
              url: maintainer.url || null,
            }))
            relationPromises.push(tx.mcpServerMaintainer.createMany({ data: maintainers }))
          }

          // Keywords
          if (serverData.keywords && serverData.keywords.length > 0) {
            const keywords = serverData.keywords.map((keyword) => ({
              mcpServerId: mcpServer.id,
              keyword: keyword,
            }))
            relationPromises.push(tx.mcpServerKeyword.createMany({ data: keywords }))
          }

          // Operating systems
          if (serverData.operatingSystem && serverData.operatingSystem.length > 0) {
            const operatingSystems = serverData.operatingSystem.map((os) => ({
              mcpServerId: mcpServer.id,
              operatingSystem: os === "Cross-platform" ? ("CrossPlatform" as const) : (os as any),
            }))
            relationPromises.push(tx.mcpServerOperatingSystem.createMany({ data: operatingSystems }))
          }

          // Programming languages
          if (serverData.programmingLanguage && serverData.programmingLanguage.length > 0) {
            const programmingLanguages = serverData.programmingLanguage.map((lang) => ({
              mcpServerId: mcpServer.id,
              programmingLanguage:
                lang === "C#" ? ("CSharp" as const) : lang === "C++" ? ("CPlusPlus" as const) : (lang as any),
            }))
            relationPromises.push(tx.mcpServerProgrammingLanguage.createMany({ data: programmingLanguages }))
          }

          // Features
          if (serverData.featureList && serverData.featureList.length > 0) {
            const features = serverData.featureList.map((feature) => ({
              mcpServerId: mcpServer.id,
              feature: feature,
            }))
            relationPromises.push(tx.mcpServerFeature.createMany({ data: features }))
          }

          // Execute all relation creation promises within the transaction
          await Promise.all(relationPromises)
        })

        // Store MCP tools from external source
        const serverTools = mcpToolsData[serverData.identifier]
        if (serverTools && serverTools.tools && Array.isArray(serverTools.tools)) {
          try {
            console.log(`Adding tools for ${serverData.identifier} from external source`)

            // Insert new tools
            const toolsToInsert = serverTools.tools.map((tool: any) => ({
              mcpServerId: mcpServer.id,
              name: tool.name,
              description: tool.description || null,
              inputSchema: tool.input_schema ? JSON.stringify(tool.input_schema) : null,
              outputSchema: tool.output_schema ? JSON.stringify(tool.output_schema) : null,
              lastChecked: new Date(),
            }))

            if (toolsToInsert.length > 0) {
              await prisma.mcpServerTool.createMany({
                data: toolsToInsert,
              })
              console.log(`Added ${toolsToInsert.length} tools for ${serverData.identifier}`)
            }
          } catch (toolError) {
            console.warn(
              `Failed to add tools for ${serverData.identifier}:`,
              toolError instanceof Error ? toolError.message : "Unknown error",
            )
            // Don't fail the entire server import if tools addition fails
          }
        }

        results.push({
          identifier: serverData.identifier,
          name: serverData.name,
          action: existingServer ? "updated" : "created",
          id: mcpServer.id,
        })

        processedCount++
      } catch (error) {
        console.error(`Error processing server ${serverData.identifier}:`, error)
        errorCount++
        results.push({
          identifier: serverData.identifier,
          name: serverData.name,
          action: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    logger.info("Registry update completed", {
      processed: processedCount,
      errors: errorCount,
      total: ecosystemData.length,
    })

    // Post to Bluesky and Zulip about new MCP servers
    const newServers = results.filter((r) => r.action === "created")
    let blueskyPostsSuccessful = 0
    let zulipPostsSuccessful = 0

    for (let i = 0; i < newServers.length; i++) {
      const server = newServers[i]

      // Post to Bluesky
      const postText = generateMcpServerPost(server)
      const posted = await postToBluesky({ text: postText })
      if (posted) {
        blueskyPostsSuccessful++
      }

      // Post to Zulip
      const messageText = generateMcpServerMessage(server)
      const zulipPosted = await sendStreamMessage("biocontext-ai", "Registry updates", messageText)
      if (zulipPosted) {
        zulipPostsSuccessful++
      }

      // Add delay between iterations to avoid rate limits (except after last server)
      if (i < newServers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay
      }
    }

    // Invalidate all registry-related caches
    revalidateTag("registry:list", "max")
    revalidateTag("registry:server", "max")
    revalidateTag("registry:metrics", "max")

    return createSuccessResponse({
      message: "Registry update completed",
      processed: processedCount,
      errors: errorCount,
      total: ecosystemData.length,
      results: results,
      lastUpdated: new Date().toISOString(),
      blueskyPostsSuccessful: blueskyPostsSuccessful,
      blueskyPostsTotal: newServers.length,
      zulipPostsSuccessful: zulipPostsSuccessful,
      zulipPostsTotal: newServers.length,
    })
  } catch (error) {
    logger.error("Registry update failed", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse(error, "Failed to update registry")
  }
}

export async function GET(request: NextRequest) {
  logger.apiRequest("GET", "/api/registry/update")

  try {
    // Get update status and last run information
    const serverCount = await prisma.mcpServer.count()
    const latestServer = await prisma.mcpServer.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true, identifier: true },
    })

    return createSuccessResponse({
      totalServers: serverCount,
      lastUpdated: latestServer?.updatedAt || null,
      lastUpdatedServer: latestServer?.identifier || null,
      status: "operational",
    })
  } catch (error) {
    logger.error("Failed to get registry status", error instanceof Error ? error : new Error(String(error)))
    return createErrorResponse(error, "Failed to get registry status")
  }
}
