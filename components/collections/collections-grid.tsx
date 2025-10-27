"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionWithOwner } from "@/lib/collections"
import { BookmarkIcon, Edit, Globe, Lock, User } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import EditCollectionDialog from "./edit-collection-dialog"

interface CollectionsGridProps {
  collections: CollectionWithOwner[]
  showOwner?: boolean
  showEditButton?: boolean
}

export default function CollectionsGrid({
  collections,
  showOwner = false,
  showEditButton = false,
}: CollectionsGridProps) {
  const { data: session } = useSession()

  if (collections.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <Card
          key={collection.id}
          className="hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border group flex flex-col"
        >
          <CardHeader className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  <Link href={`/collection/${collection.slug}`}>{collection.name}</Link>
                  {collection.isDefault && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Default
                    </Badge>
                  )}
                </CardTitle>

                {showOwner && collection.owner && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{collection.owner.name || "Anonymous"}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {collection.isPublic ? (
                  <Globe className="h-4 w-4 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-500" />
                )}

                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-md border">
                  <BookmarkIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {collection._count.items}
                  </span>
                </div>
              </div>
            </div>

            {collection.description && (
              <CardDescription className="line-clamp-2 mt-2">{collection.description}</CardDescription>
            )}

            {collection.keywords && collection.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {collection.keywords.slice(0, 3).map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {collection.keywords.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{collection.keywords.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-0 space-y-2">
            <Button asChild variant="default" size="sm" className="w-full">
              <Link href={`/collection/${collection.slug}`}>View Collection</Link>
            </Button>

            {showEditButton && session?.user?.id === collection.ownerId && (
              <EditCollectionDialog collection={collection} onUpdate={() => window.location.reload()}>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </EditCollectionDialog>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
