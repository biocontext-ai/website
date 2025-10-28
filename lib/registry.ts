import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// Type for the complete MCP server data with all relations
type McpServerWithRelations = Prisma.McpServerGetPayload<{
  include: {
    additionalTypes: true
    maintainers: true
    keywords: true
    operatingSystems: true
    programmingLanguages: true
    features: true
    reviews: {
      include: {
        author: {
          select: {
            id: true
            name: true
            image: true
          }
        }
      }
    }
    githubReadme: true
    mcpTools: true
  }
}>

// Type for review with author
export type ReviewWithAuthor = Prisma.ReviewGetPayload<{
  include: {
    author: {
      select: {
        id: true
        name: true
        image: true
      }
    }
  }
}>

// Type for aggregate rating calculated on-the-fly
export interface AggregateRating {
  helpfulCount: number // Count of thumbs up votes
  unhelpfulCount: number // Count of thumbs down votes
  totalReviews: number
  netVotes: number // helpfulCount - unhelpfulCount, minimum 0
}

// Type for server with review summary for registry list
export interface MCPServerWithReviewSummary extends MCPServer {
  aggregateRating: AggregateRating
  githubStars?: number
}

// Calculate aggregate rating from reviews
export function calculateAggregateRating(reviews: { isHelpful: boolean }[]): AggregateRating {
  if (reviews.length === 0) {
    return {
      helpfulCount: 0,
      unhelpfulCount: 0,
      totalReviews: 0,
      netVotes: 0,
    }
  }

  const helpfulCount = reviews.filter((review) => review.isHelpful).length
  const unhelpfulCount = reviews.filter((review) => !review.isHelpful).length
  const netVotes = Math.max(0, helpfulCount - unhelpfulCount) // Minimum 0

  return {
    helpfulCount,
    unhelpfulCount,
    totalReviews: reviews.length,
    netVotes,
  }
}

// Interface matching the original MCPServer interface from the JSON
export interface MCPServer {
  "@context"?: string
  "@type"?: string
  "@id"?: string
  "additionalType"?: string[]
  "identifier"?: string
  "name": string
  "description": string
  "keywords"?: string[]
  "license"?: string
  "programmingLanguage"?: string[]
  "codeRepository"?: string
  "url"?: string
  "softwareHelp"?: {
    "@type": "CreativeWork"
    "url": string
    "name": string
  }
  "maintainer"?: Array<{
    "@type": string
    "name": string
    "identifier"?: string
    "url"?: string
  }>
  "datePublished"?: string
  "applicationCategory"?: string
  "operatingSystem"?: string[]
  "featureList"?: string[]
  "installationConfig"?: any
}

// Transform Prisma data to MCPServer interface
export function transformPrismaToMCPServer(
  server: Omit<McpServerWithRelations, "reviews"> & { reviews?: any[] },
): MCPServer {
  return {
    "@context": server.context,
    "@type": server.type,
    "@id": server.uri,
    "additionalType": server.additionalTypes.map((at) => {
      // Convert enum values back to schema.org URLs
      switch (at.type) {
        case "ScholarlyArticle":
          return "https://schema.org/ScholarlyArticle"
        case "SoftwareSourceCode":
          return "https://schema.org/SoftwareSourceCode"
        default:
          return at.type
      }
    }),
    "identifier": server.identifier,
    "name": server.name,
    "description": server.description,
    "keywords": server.keywords.map((k) => k.keyword),
    "license": server.license as string | undefined,
    "programmingLanguage": server.programmingLanguages.map((pl) => {
      // Convert enum values back to display names
      switch (pl.programmingLanguage) {
        case "CPlusPlus":
          return "C++"
        case "CSharp":
          return "C#"
        default:
          return pl.programmingLanguage
      }
    }),
    "codeRepository": server.codeRepository,
    "url": server.url || undefined,
    "softwareHelp": server.softwareHelpUrl
      ? {
          "@type": "CreativeWork",
          "url": server.softwareHelpUrl,
          "name": server.softwareHelpName || "Documentation",
        }
      : undefined,
    "maintainer": server.maintainers.map((m) => ({
      "@type": m.type,
      "name": m.name,
      "identifier": m.identifier || undefined,
      "url": m.url || undefined,
    })),
    "datePublished": server.datePublished?.toISOString().split("T")[0], // Format as YYYY-MM-DD
    "applicationCategory": server.applicationCategory,
    "operatingSystem": server.operatingSystems.map((os) => {
      // Convert enum values back to display names
      switch (os.operatingSystem) {
        case "CrossPlatform":
          return "Cross-platform"
        default:
          return os.operatingSystem
      }
    }),
    "featureList": server.features.map((f) => f.feature),
    "installationConfig": server.installationConfig,
  }
}

// Type for server-side pagination and search
export interface GetMCPServersParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: "alphabetical" | "rating-desc" | "stars-desc" | "date-newest" | "date-oldest"
  hasInstallation?: boolean
  isRemote?: boolean
}

export interface PaginatedMCPServers {
  servers: MCPServerWithReviewSummary[]
  totalCount: number
  totalPages: number
  currentPage: number
}

// Get paginated MCP servers with server-side search and sorting
export async function getPaginatedMCPServers({
  page = 1,
  limit = 18,
  search = "",
  sortBy = "alphabetical",
  hasInstallation,
  isRemote,
}: GetMCPServersParams): Promise<PaginatedMCPServers> {
  try {
    const skip = (page - 1) * limit

    // Build base filter conditions
    const baseConditions: Prisma.McpServerWhereInput[] = [
      {
        identifier: {
          not: "example/example-mcp-server",
        },
      },
    ]

    // Add installation filter
    if (hasInstallation !== undefined && hasInstallation) {
      baseConditions.push({
        installationConfig: {
          not: Prisma.DbNull,
        },
      })
    }

    // Add remote filter
    if (isRemote !== undefined && isRemote) {
      baseConditions.push({
        url: {
          not: null,
        },
      })
    }

    // Build search conditions
    const searchConditions: Prisma.McpServerWhereInput = search
      ? {
          AND: [
            ...baseConditions,
            {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  keywords: {
                    some: {
                      keyword: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                },
                {
                  features: {
                    some: {
                      feature: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                },
              ],
            },
          ],
        }
      : {
          AND: baseConditions,
        }

    // Determine sort order
    let orderBy: Prisma.McpServerOrderByWithRelationInput[] = [{ name: "asc" }]
    const needsInMemorySort = sortBy === "rating-desc" // Only rating needs in-memory sort

    switch (sortBy) {
      case "stars-desc":
        orderBy = [{ githubStars: { starCount: "desc" } }]
        break
      case "date-newest":
        orderBy = [{ datePublished: { sort: "desc", nulls: "last" } }]
        break
      case "date-oldest":
        orderBy = [{ datePublished: { sort: "asc", nulls: "last" } }]
        break
      // For rating-desc, we'll sort in memory after fetching all servers
    }

    // For hasInstallation filter, we need to fetch all and filter in memory
    // because JSON field filtering has limitations
    const needsInMemoryFilter = hasInstallation === true
    const needsInMemoryProcessing = needsInMemorySort || needsInMemoryFilter

    // Get total count for pagination (before installation filter)
    const totalCount = await prisma.mcpServer.count({
      where: searchConditions,
    })

    // Fetch servers - for in-memory processing, fetch all; otherwise use pagination
    const servers = await prisma.mcpServer.findMany({
      where: searchConditions,
      include: {
        additionalTypes: true,
        maintainers: true,
        keywords: true,
        operatingSystems: true,
        programmingLanguages: true,
        features: true,
        reviews: {
          where: {
            isApproved: true,
          },
          select: {
            isHelpful: true,
          },
        },
        githubStars: {
          select: {
            starCount: true,
          },
        },
        githubReadme: true,
        mcpTools: true,
      },
      orderBy,
      // Only apply pagination at database level if we don't need in-memory processing
      ...(needsInMemoryProcessing ? {} : { skip, take: limit }),
    })

    // Transform servers
    let transformedServers = servers.map((server) => {
      return {
        ...transformPrismaToMCPServer(server),
        aggregateRating: calculateAggregateRating(server.reviews),
        githubStars: server.githubStars?.starCount,
        installationConfig: server.installationConfig,
      }
    })

    // Filter by installation config if needed (must be done after fetching due to JSON field limitations)
    if (hasInstallation) {
      transformedServers = transformedServers.filter((server) => {
        const config = server.installationConfig
        return config !== null && typeof config === "object" && Object.keys(config).length > 0
      })
    }

    // Sort in memory for rating-desc (case-insensitive)
    if (sortBy === "rating-desc") {
      transformedServers.sort((a, b) => {
        if (b.aggregateRating.netVotes !== a.aggregateRating.netVotes) {
          return b.aggregateRating.netVotes - a.aggregateRating.netVotes
        }
        if (b.aggregateRating.totalReviews !== a.aggregateRating.totalReviews) {
          return b.aggregateRating.totalReviews - a.aggregateRating.totalReviews
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      })
      // Apply pagination after sorting
      transformedServers = transformedServers.slice(skip, skip + limit)
    } else if (sortBy === "alphabetical") {
      // Add case-insensitive secondary sort (database sort is case-sensitive)
      transformedServers.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    } else if (sortBy === "stars-desc") {
      // Add secondary sort by name (case-insensitive)
      transformedServers.sort((a, b) => {
        const aStars = a.githubStars || 0
        const bStars = b.githubStars || 0
        if (bStars !== aStars) {
          return bStars - aStars
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      })
    } else if (sortBy === "date-newest" || sortBy === "date-oldest") {
      // Add secondary sort by name (case-insensitive)
      transformedServers.sort((a, b) => {
        const aDate = a.datePublished ? new Date(a.datePublished).getTime() : sortBy === "date-newest" ? 0 : Date.now()
        const bDate = b.datePublished ? new Date(b.datePublished).getTime() : sortBy === "date-newest" ? 0 : Date.now()
        if (sortBy === "date-newest") {
          if (bDate !== aDate) {
            return bDate - aDate
          }
        } else {
          if (aDate !== bDate) {
            return aDate - bDate
          }
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      })
    }

    // Apply pagination if we did in-memory processing
    if (needsInMemoryProcessing) {
      transformedServers = transformedServers.slice(skip, skip + limit)
    }

    // Recalculate counts after filtering
    const actualTotalBeforeSlice = needsInMemoryFilter
      ? servers.filter((s) => {
          const config = s.installationConfig
          return config !== null && typeof config === "object" && Object.keys(config).length > 0
        }).length
      : totalCount

    const totalPages = Math.ceil(actualTotalBeforeSlice / limit)

    return {
      servers: transformedServers,
      totalCount: actualTotalBeforeSlice,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error("Error fetching paginated MCP servers:", error)
    return {
      servers: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    }
  }
}

// Get all MCP servers from database with review summaries
export async function getAllMCPServers(): Promise<MCPServerWithReviewSummary[]> {
  try {
    const servers = await prisma.mcpServer.findMany({
      include: {
        additionalTypes: true,
        maintainers: true,
        keywords: true,
        operatingSystems: true,
        programmingLanguages: true,
        features: true,
        reviews: {
          where: {
            isApproved: true, // Only include approved reviews
          },
          select: {
            isHelpful: true,
          },
        },
        githubStars: {
          select: {
            starCount: true,
          },
        },
        githubReadme: true,
        mcpTools: true,
      },
      orderBy: [{ name: "asc" }],
    })

    return servers
      .filter((server) => server.identifier !== "example/example-mcp-server") // Filter out example
      .map((server) => {
        // Create a simplified server object for transformation
        const simplifiedServer = {
          ...server,
          reviews: [], // Remove reviews from transformation since we only need rating data
        }
        return {
          ...transformPrismaToMCPServer(simplifiedServer),
          aggregateRating: calculateAggregateRating(server.reviews),
          githubStars: server.githubStars?.starCount,
        }
      })
  } catch (error) {
    console.error("Error fetching MCP servers:", error)
    return []
  }
}

// Get a single MCP server by identifier
export async function getMCPServerByIdentifier(identifier: string): Promise<MCPServer | null> {
  try {
    const decodedIdentifier = decodeURIComponent(identifier)

    const server = await prisma.mcpServer.findUnique({
      where: {
        identifier: decodedIdentifier,
      },
      include: {
        additionalTypes: true,
        maintainers: true,
        keywords: true,
        operatingSystems: true,
        programmingLanguages: true,
        features: true,
        reviews: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        githubReadme: true,
        mcpTools: true,
      },
    })

    if (!server) {
      return null
    }

    return transformPrismaToMCPServer(server)
  } catch (error) {
    console.error("Error fetching MCP server:", error)
    return null
  }
}

// Get MCP server with complete review data for detail page
export async function getMCPServerWithReviews(identifier: string) {
  try {
    const decodedIdentifier = decodeURIComponent(identifier)

    const server = await prisma.mcpServer.findUnique({
      where: {
        identifier: decodedIdentifier,
      },
      include: {
        additionalTypes: true,
        maintainers: true,
        keywords: true,
        operatingSystems: true,
        programmingLanguages: true,
        features: true,
        reviews: {
          where: {
            isApproved: true, // Only show approved reviews to public
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            datePublished: "desc",
          },
        },
        githubStars: {
          select: {
            starCount: true,
          },
        },
        githubReadme: {
          select: {
            content: true,
            encoding: true,
            sha: true,
            lastChecked: true,
            id: true,
            mcpServerId: true,
            size: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        mcpTools: {
          orderBy: {
            name: "asc",
          },
        },
      },
    })

    if (!server) {
      return null
    }

    return {
      server: transformPrismaToMCPServer(server),
      serverId: server.id, // Include the Prisma server ID for reviews
      reviews: server.reviews,
      aggregateRating: calculateAggregateRating(server.reviews),
      githubStars: server.githubStars?.starCount,
      githubReadme: server.githubReadme,
      mcpTools: server.mcpTools,
    }
  } catch (error) {
    console.error("Error fetching MCP server with reviews:", error)
    return null
  }
}

// Add a review to an MCP server
export async function addReview({
  mcpServerId,
  authorId,
  name,
  reviewBody,
  isHelpful,
}: {
  mcpServerId: string
  authorId: string
  name: string
  reviewBody: string
  isHelpful: boolean
}) {
  try {
    const review = await prisma.review.create({
      data: {
        name,
        reviewBody,
        isHelpful,
        authorId,
        mcpServerId,
        isPending: true, // Reviews start as pending approval
        isApproved: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return review
  } catch (error) {
    console.error("Error adding review:", error)
    throw new Error("Failed to add review")
  }
}

// Update an existing review
export async function updateReview(
  reviewId: string,
  {
    name,
    reviewBody,
    isHelpful,
  }: {
    name: string
    reviewBody: string
    isHelpful: boolean
  },
) {
  try {
    const review = await prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        name,
        reviewBody,
        isHelpful,
        datePublished: new Date(), // Update the published date
        isPending: true, // Reset to pending when updated
        isApproved: false, // Reset approval when updated
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return review
  } catch (error) {
    console.error("Error updating review:", error)
    throw new Error("Failed to update review")
  }
}

// Delete a review (only by the author)
export async function deleteReview(reviewId: string, userId: string) {
  try {
    // First verify the review exists and belongs to the user
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    })

    if (!review) {
      throw new Error("Review not found")
    }

    if (review.authorId !== userId) {
      throw new Error("Unauthorized: You can only delete your own reviews")
    }

    // Delete the review
    await prisma.review.delete({
      where: {
        id: reviewId,
        authorId: userId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}

// Check if user has already reviewed a server and return the review if it exists
export async function hasUserReviewed(userId: string, mcpServerId: string) {
  try {
    const existingReview = await prisma.review.findUnique({
      where: {
        authorId_mcpServerId: {
          authorId: userId,
          mcpServerId: mcpServerId,
        },
      },
    })

    return existingReview
  } catch (error) {
    console.error("Error checking user review:", error)
    return null
  }
}

// Delete an MCP server (admin only)
export async function deleteMCPServer(identifier: string): Promise<void> {
  try {
    const decodedIdentifier = decodeURIComponent(identifier)

    // Find the server first to get its ID
    const server = await prisma.mcpServer.findUnique({
      where: {
        identifier: decodedIdentifier,
      },
    })

    if (!server) {
      throw new Error("MCP server not found")
    }

    // Delete the server - this will cascade to all related records due to onDelete: Cascade
    await prisma.mcpServer.delete({
      where: {
        id: server.id,
      },
    })
  } catch (error) {
    console.error("Error deleting MCP server:", error)
    throw new Error("Failed to delete MCP server")
  }
}

// Admin functions for review management

// Get all pending reviews for admin approval
export async function getPendingReviews() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        isPending: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        mcpServer: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
      },
      orderBy: {
        datePublished: "desc",
      },
    })

    return reviews
  } catch (error) {
    console.error("Error fetching pending reviews:", error)
    throw new Error("Failed to fetch pending reviews")
  }
}

// Approve a review (admin only)
export async function approveReview(reviewId: string, adminUserId: string) {
  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isPending: false,
        isApproved: true,
        approvedBy: adminUserId,
        approvedAt: new Date(),
      },
    })

    console.log(`Review ${reviewId} approved by admin ${adminUserId}`)
    return { success: true, review }
  } catch (error) {
    console.error("Error approving review:", error)
    throw new Error("Failed to approve review")
  }
}

// Delete review and optionally block user (admin only)
export async function deleteReviewAndBlockUser(reviewId: string, adminUserId: string, blockUser: boolean = false) {
  try {
    // First get the review to find the author
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author: true,
      },
    })

    if (!review) {
      throw new Error("Review not found")
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    })

    // Block the user if requested
    if (blockUser) {
      await prisma.user.update({
        where: { id: review.authorId },
        data: { status: "BLOCKED" },
      })
    }

    return {
      success: true,
      userBlocked: blockUser,
      reviewAuthor: review.author.email,
    }
  } catch (error) {
    console.error("Error deleting review and blocking user:", error)
    throw new Error("Failed to delete review and block user")
  }
}

// Search MCP servers (for client-side filtering)
export function filterMCPServers(
  servers: MCPServerWithReviewSummary[],
  searchQuery: string,
): MCPServerWithReviewSummary[] {
  if (!searchQuery.trim()) {
    return servers
  }

  const query = searchQuery.toLowerCase()

  return servers.filter(
    (server) =>
      server.name.toLowerCase().includes(query) ||
      server.description.toLowerCase().includes(query) ||
      (server.keywords && server.keywords.some((keyword) => keyword.toLowerCase().includes(query))) ||
      (server.featureList && server.featureList.some((feature) => feature.toLowerCase().includes(query))) ||
      (server.programmingLanguage && server.programmingLanguage.some((lang) => lang.toLowerCase().includes(query))),
  )
}

// Get registry metrics for the home page
export interface RegistryMetrics {
  totalServers: number
  totalTools: number
  serversWithInstallation: number
  remoteServers: number
}

export async function getRegistryMetrics(): Promise<RegistryMetrics> {
  try {
    // Get total count of servers (excluding example)
    const totalServers = await prisma.mcpServer.count({
      where: {
        identifier: {
          not: "example/example-mcp-server",
        },
      },
    })

    // Get total count of tools across all servers
    const totalTools = await prisma.mcpServerTool.count({
      where: {
        mcpServer: {
          identifier: {
            not: "example/example-mcp-server",
          },
        },
      },
    })

    // Get count of servers with installation config (mcp.json)
    // Need to fetch and check manually since JSON field checks are limited
    const serversWithConfig = await prisma.mcpServer.findMany({
      where: {
        identifier: {
          not: "example/example-mcp-server",
        },
        installationConfig: {
          not: Prisma.DbNull,
        },
      },
      select: {
        installationConfig: true,
      },
    })

    // Filter out servers with empty or null installation configs
    const serversWithInstallation = serversWithConfig.filter((server) => {
      const config = server.installationConfig
      return config !== null && typeof config === "object" && Object.keys(config).length > 0
    }).length

    // Get count of remote servers (servers with a url field)
    const remoteServers = await prisma.mcpServer.count({
      where: {
        AND: [
          {
            identifier: {
              not: "example/example-mcp-server",
            },
          },
          {
            url: {
              not: null,
            },
          },
        ],
      },
    })

    return {
      totalServers,
      totalTools,
      serversWithInstallation,
      remoteServers,
    }
  } catch (error) {
    console.error("Error fetching registry metrics:", error)
    return {
      totalServers: 0,
      totalTools: 0,
      serversWithInstallation: 0,
      remoteServers: 0,
    }
  }
}
