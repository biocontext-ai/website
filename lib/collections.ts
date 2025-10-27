import { prisma } from "@/lib/prisma"
import { Collection, CollectionItem, Prisma } from "@prisma/client"
import "server-only"

// Types for collections with related data
export type CollectionWithItems = Prisma.CollectionGetPayload<{
  include: {
    items: {
      include: {
        mcpServer: {
          include: {
            keywords: true
            programmingLanguages: true
            reviews: {
              select: {
                isHelpful: true
              }
            }
            githubStars: {
              select: {
                starCount: true
              }
            }
          }
        }
      }
    }
    owner: {
      select: {
        id: true
        name: true
        image: true
      }
    }
  }
}>

export type CollectionWithOwner = Prisma.CollectionGetPayload<{
  include: {
    owner: {
      select: {
        id: true
        name: true
        image: true
      }
    }
    _count: {
      select: {
        items: true
      }
    }
  }
}>

// Generate a URL-friendly slug from collection name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Get all collections for a user
export async function getUserCollections(userId: string): Promise<CollectionWithOwner[]> {
  try {
    const collections = await prisma.collection.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [
        { isDefault: "desc" }, // Default collection first
        { name: "asc" },
      ],
    })

    return collections
  } catch (error) {
    console.error("Error fetching user collections:", error)
    return []
  }
}

// Get all public collections
export async function getPublicCollections(): Promise<CollectionWithOwner[]> {
  try {
    const collections = await prisma.collection.findMany({
      where: {
        isPublic: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    })

    return collections
  } catch (error) {
    console.error("Error fetching public collections:", error)
    return []
  }
}

// Get a collection by slug with all items
export async function getCollectionBySlug(slug: string, userId?: string): Promise<CollectionWithItems | null> {
  try {
    const collection = await prisma.collection.findUnique({
      where: {
        slug,
        OR: [
          { isPublic: true },
          ...(userId ? [{ ownerId: userId }] : []), // Include private collections
        ],
      },
      include: {
        items: {
          include: {
            mcpServer: {
              include: {
                keywords: true,
                programmingLanguages: true,
                reviews: {
                  select: {
                    isHelpful: true,
                  },
                },
                githubStars: {
                  select: {
                    starCount: true,
                  },
                },
              },
            },
          },
          orderBy: {
            addedAt: "desc",
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return collection
  } catch (error) {
    console.error("Error fetching collection:", error)
    return null
  }
}

// Create a new collection
export async function createCollection({
  name,
  description,
  keywords = [],
  isPublic = false,
  ownerId,
}: {
  name: string
  description?: string
  keywords?: string[]
  isPublic?: boolean
  ownerId: string
}): Promise<Collection> {
  try {
    const slug = generateSlug(name)

    // Ensure slug is unique by appending number if needed
    let uniqueSlug = slug
    let counter = 1

    while (await prisma.collection.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug: uniqueSlug,
        description,
        keywords,
        isPublic,
        ownerId,
      },
    })

    return collection
  } catch (error) {
    console.error("Error creating collection:", error)
    throw new Error("Failed to create collection")
  }
}

// Create default collection for a user
export async function createDefaultCollection(userId: string): Promise<Collection> {
  try {
    const collection = await prisma.collection.create({
      data: {
        name: "My Bookmarks",
        slug: `my-bookmarks-${userId}`,
        description: "My saved MCP servers",
        isDefault: true,
        isPublic: false,
        ownerId: userId,
      },
    })

    return collection
  } catch (error) {
    console.error("Error creating default collection:", error)
    throw new Error("Failed to create default collection")
  }
}

// Get user's default collection (create if doesn't exist)
export async function getOrCreateDefaultCollection(userId: string): Promise<Collection> {
  try {
    let defaultCollection = await prisma.collection.findFirst({
      where: {
        ownerId: userId,
        isDefault: true,
      },
    })

    if (!defaultCollection) {
      defaultCollection = await createDefaultCollection(userId)
    }

    return defaultCollection
  } catch (error) {
    console.error("Error getting/creating default collection:", error)
    throw new Error("Failed to get default collection")
  }
}

// Add MCP server to collection(s)
export async function addToCollections({
  mcpServerId,
  collectionIds,
  notes,
}: {
  mcpServerId: string
  collectionIds: string[]
  notes?: string
}): Promise<CollectionItem[]> {
  try {
    // First, find the actual MCP server by ID or identifier
    const mcpServer = await prisma.mcpServer.findFirst({
      where: {
        OR: [{ id: mcpServerId }, { identifier: mcpServerId }],
      },
    })

    if (!mcpServer) {
      throw new Error(`MCP server not found: ${mcpServerId}`)
    }

    const items = await Promise.all(
      collectionIds.map(async (collectionId) => {
        // Use upsert to handle duplicates gracefully
        return prisma.collectionItem.upsert({
          where: {
            collectionId_mcpServerId: {
              collectionId,
              mcpServerId: mcpServer.id, // Use the actual database ID
            },
          },
          update: {
            notes,
            addedAt: new Date(), // Update timestamp
          },
          create: {
            collectionId,
            mcpServerId: mcpServer.id, // Use the actual database ID
            notes,
          },
        })
      }),
    )

    return items
  } catch (error) {
    console.error("Error adding to collections:", error)
    throw new Error("Failed to add to collections")
  }
}

// Remove MCP server from collection
export async function removeFromCollection({
  mcpServerId,
  collectionId,
}: {
  mcpServerId: string
  collectionId: string
}): Promise<void> {
  try {
    // First, try to find the collection item by mcpServerId or by identifier
    const existingItem = await prisma.collectionItem.findFirst({
      where: {
        collectionId,
        OR: [{ mcpServerId: mcpServerId }, { mcpServer: { identifier: mcpServerId } }],
      },
    })

    if (!existingItem) {
      // Item doesn't exist, which is fine - it's already "removed"
      return
    }

    await prisma.collectionItem.delete({
      where: {
        id: existingItem.id,
      },
    })
  } catch (error) {
    console.error("Error removing from collection:", error)
    throw new Error("Failed to remove from collection")
  }
}

// Get collections that contain a specific MCP server
export async function getCollectionsForServer(
  mcpServerId: string,
  includePrivate = false,
  userId?: string,
): Promise<CollectionWithOwner[]> {
  try {
    const collections = await prisma.collection.findMany({
      where: {
        items: {
          some: {
            OR: [{ mcpServerId: mcpServerId }, { mcpServer: { identifier: mcpServerId } }],
          },
        },
        OR: [{ isPublic: true }, ...(includePrivate && userId ? [{ ownerId: userId }] : [])],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Order by the user's collections first if userId is provided
    const userCollections = collections.filter((c) => c.owner.id === userId)
    const publicCollections = collections.filter((c) => c.owner.id !== userId)

    return [...userCollections, ...publicCollections.slice(0, 5)]
  } catch (error) {
    return []
  }
}

// Check if user has saved a server to any collection
export async function isServerSaved(mcpServerId: string, userId: string): Promise<boolean> {
  try {
    const count = await prisma.collectionItem.count({
      where: {
        OR: [{ mcpServerId: mcpServerId }, { mcpServer: { identifier: mcpServerId } }],
        collection: {
          ownerId: userId,
        },
      },
    })

    return count > 0
  } catch (error) {
    console.error("Error checking if server is saved:", error)
    return false
  }
}

// Update collection details
export async function updateCollection(
  collectionId: string,
  {
    name,
    description,
    keywords,
    isPublic,
  }: {
    name?: string
    description?: string
    keywords?: string[]
    isPublic?: boolean
  },
): Promise<Collection> {
  try {
    const updateData: Prisma.CollectionUpdateInput = {}

    if (name !== undefined) {
      updateData.name = name

      // Generate unique slug
      const baseSlug = generateSlug(name)
      let uniqueSlug = baseSlug
      let counter = 1

      // Check for existing collections with the same slug (excluding current collection)
      while (
        await prisma.collection.findFirst({
          where: {
            slug: uniqueSlug,
            id: { not: collectionId },
          },
        })
      ) {
        uniqueSlug = `${baseSlug}-${counter}`
        counter++
      }

      updateData.slug = uniqueSlug
    }
    if (description !== undefined) updateData.description = description
    if (keywords !== undefined) updateData.keywords = keywords
    if (isPublic !== undefined) updateData.isPublic = isPublic

    const collection = await prisma.collection.update({
      where: {
        id: collectionId,
      },
      data: updateData,
    })

    return collection
  } catch (error) {
    console.error("Error updating collection:", error)
    throw new Error("Failed to update collection")
  }
}

// Delete collection (only if not default)
export async function deleteCollection(collectionId: string, userId: string): Promise<void> {
  try {
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
    })

    if (!collection) {
      throw new Error("Collection not found")
    }

    if (collection.ownerId !== userId) {
      throw new Error("Unauthorized: You can only delete your own collections")
    }

    if (collection.isDefault) {
      throw new Error("Cannot delete default collection")
    }

    await prisma.collection.delete({
      where: {
        id: collectionId,
      },
    })
  } catch (error) {
    console.error("Error deleting collection:", error)
    throw error
  }
}

// Get all collections for a user with server status
export async function getUserCollectionsWithServerStatus(
  userId: string,
  mcpServerId: string,
): Promise<(CollectionWithOwner & { containsServer: boolean })[]> {
  try {
    // First, find the actual MCP server by ID or identifier
    const mcpServer = await prisma.mcpServer.findFirst({
      where: {
        OR: [{ id: mcpServerId }, { identifier: mcpServerId }],
      },
    })

    const collections = await prisma.collection.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
        items: {
          where: mcpServer
            ? {
                mcpServerId: mcpServer.id, // Use the actual database ID
              }
            : {
                // Fallback if server not found - this will return empty results
                mcpServerId: "nonexistent",
              },
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    })

    return collections.map((collection) => ({
      ...collection,
      containsServer: collection.items.length > 0,
      items: undefined, // Remove items from the response to keep it clean
    })) as (CollectionWithOwner & { containsServer: boolean })[]
  } catch (error) {
    console.error("Error fetching user collections with server status:", error)
    return []
  }
}
