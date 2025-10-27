import { auth } from "@/auth"
import EditCollectionDialog from "@/components/collections/edit-collection-dialog"
import RegistryCard from "@/components/registry/registry-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getCollectionBySlug } from "@/lib/collections"
import { calculateAggregateRating, transformPrismaToMCPServer } from "@/lib/registry"
import { BookmarkIcon, Calendar, Edit, Globe, Lock, User } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

interface CollectionPageProps {
  params: Promise<{ identifier: string }>
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { identifier } = await params
  const session = await auth()
  const collection = await getCollectionBySlug(identifier, session?.user?.id)

  if (!collection) {
    return {
      title: "Collection Not Found | BioContextAI",
    }
  }

  return {
    title: `${collection.name} | Collections | BioContextAI`,
    description: collection.description || `A curated collection of biomedical MCP servers: ${collection.name}`,
    keywords: collection.keywords?.length ? collection.keywords : ["MCP", "collections", "biomedical"],
    openGraph: {
      title: `${collection.name} | BioContextAI`,
      description: collection.description || `A curated collection of biomedical MCP servers`,
      type: "website",
    },
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { identifier } = await params
  const session = await auth()
  const collection = await getCollectionBySlug(identifier, session?.user?.id)

  if (!collection) {
    notFound()
  }

  // Check if user can view this collection
  const canView = collection.isPublic || session?.user?.id === collection.ownerId
  if (!canView) {
    notFound()
  }

  const isOwner = session?.user?.id === collection.ownerId

  // Transform servers for display
  const servers = collection.items.map((item) => {
    // Create a mock server structure for transformPrismaToMCPServer
    const mockServer = {
      ...item.mcpServer,
      reviews: [], // Use empty reviews since we only have rating data
      additionalTypes: [],
      maintainers: [],
      operatingSystems: [],
      features: [],
      githubReadme: null,
      mcpTools: [],
    }

    const transformedServer = transformPrismaToMCPServer(mockServer)

    return {
      ...transformedServer,
      aggregateRating: calculateAggregateRating(item.mcpServer.reviews),
      githubStars: item.mcpServer.githubStars?.starCount,
      addedAt: item.addedAt,
      notes: item.notes,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8" itemScope itemType="https://schema.org/Collection">
      <meta itemProp="name" content={collection.name} />
      {collection.description && <meta itemProp="description" content={collection.description} />}

      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight" itemProp="name">
                  {collection.name}
                </h1>

                <div className="flex items-center gap-2">
                  {collection.isPublic ? (
                    <Badge variant="default" className="gap-1">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}

                  {collection.isDefault && <Badge variant="outline">Default</Badge>}
                </div>
              </div>

              {collection.description && (
                <p className="text-lg text-muted-foreground leading-relaxed" itemProp="description">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span itemProp="author">{collection.owner.name || "Anonymous"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <BookmarkIcon className="h-4 w-4" />
                  <span>
                    {collection.items.length} server{collection.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {collection.keywords && collection.keywords.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Keywords</span>
                  <div className="flex flex-wrap gap-1">
                    {collection.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs" itemProp="keywords">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isOwner && (
              <div className="shrink-0">
                <EditCollectionDialog collection={collection}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Collection
                  </Button>
                </EditCollectionDialog>
              </div>
            )}
          </div>

          <Separator />
        </div>

        {/* Content */}
        <div className="space-y-6">
          {servers.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">MCP Servers ({servers.length})</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map((server, index) => (
                  <div key={server["@id"] || server.identifier || index} className="space-y-2">
                    <RegistryCard item={server}>
                      <div className="space-y-2 mb-4">
                        {server.notes && (
                          <div className="space-y-2 mb-4">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Note
                            </span>
                            <div className="p-3 bg-muted/50 rounded-md border border-border/50">
                              <p className="text-sm text-muted-foreground">{server.notes}</p>
                            </div>
                          </div>
                        )}

                        {server.addedAt && (
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(server.addedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </RegistryCard>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-4">
              <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No servers yet</h3>
                <p className="text-muted-foreground">
                  {isOwner
                    ? "Start adding MCP servers to your collection by browsing the registry."
                    : "This collection doesn't contain any servers yet."}
                </p>
              </div>
              {isOwner && (
                <Button asChild variant="outline">
                  <Link href="/registry">Browse Registry</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
