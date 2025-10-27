import { auth } from "@/auth"
import CollectionsGrid from "@/components/collections/collections-grid"
import CreateCollectionDialog from "@/components/collections/create-collection-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublicCollections, getUserCollections } from "@/lib/collections"
import { BookmarkIcon, Globe, PlusCircle, User } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Collections | BioContextAI",
  description: "Organize and discover curated collections of biomedical Model Context Protocol servers",
  keywords: ["MCP", "collections", "biomedical", "healthcare", "AI", "research"],
  openGraph: {
    title: "Collections | BioContextAI",
    description: "Organize and discover curated collections of biomedical MCP servers",
    type: "website",
  },
}

export default async function CollectionsPage() {
  const session = await auth()
  const isAuthenticated = !!session?.user

  // Fetch collections based on authentication status
  const [userCollections, publicCollections] = await Promise.all([
    isAuthenticated ? getUserCollections(session.user.id) : Promise.resolve([]),
    getPublicCollections(),
  ])

  return (
    <div className="container mx-auto px-4 py-8" itemScope itemType="https://schema.org/WebPage">
      <meta itemProp="name" content="BioContextAI Collections" />
      <meta
        itemProp="description"
        content="Organize and discover curated collections of biomedical Model Context Protocol servers"
      />

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight" itemProp="headline">
              <span className="text-foreground">Collections</span>
            </h1>
            <p className="text-lg text-center text-muted-foreground max-w-lg mx-auto">
              Organize and discover curated collections of biomedical MCP servers
            </p>
          </div>

          {isAuthenticated && (
            <div className="flex justify-center">
              <CreateCollectionDialog>
                <Button className="gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Create Collection
                </Button>
              </CreateCollectionDialog>
            </div>
          )}
        </div>

        {/* Collections Content */}
        <div className="space-y-6">
          {isAuthenticated ? (
            <Tabs defaultValue="my-collections" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-collections" className="gap-2">
                  <User className="h-4 w-4" />
                  My Collections ({userCollections.length})
                </TabsTrigger>
                <TabsTrigger value="public-collections" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Public Collections ({publicCollections.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-collections" className="mt-6">
                {userCollections.length > 0 ? (
                  <CollectionsGrid collections={userCollections} showOwner={false} showEditButton={true} />
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No collections yet</h3>
                      <p className="text-muted-foreground">Create your first collection to organize MCP servers</p>
                    </div>
                    <CreateCollectionDialog>
                      <Button variant="outline" className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Create Your First Collection
                      </Button>
                    </CreateCollectionDialog>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="public-collections" className="mt-6">
                {publicCollections.length > 0 ? (
                  <CollectionsGrid collections={publicCollections} showOwner={true} />
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No public collections yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to create a public collection for the community
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              {publicCollections.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>
                      Showing {publicCollections.length} public{" "}
                      {publicCollections.length === 1 ? "collection" : "collections"}
                    </span>
                  </div>
                  <CollectionsGrid collections={publicCollections} showOwner={true} />
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No public collections yet</h3>
                    <p className="text-muted-foreground">Sign in to create the first public collection</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
