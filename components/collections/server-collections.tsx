"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { hasCollectionsProperty } from "@/types/api"
import { BookmarkIcon, Globe, Lock, User } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  isPublic: boolean
  owner: {
    id: string
    name: string | null
  }
  _count: {
    items: number
  }
}

interface ServerCollectionsProps {
  serverId: string
  serverName: string
}

export default function ServerCollections({ serverId, serverName }: ServerCollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [serverId])

  const loadCollections = async () => {
    try {
      const response = await fetch(`/api/collections/server/${encodeURIComponent(serverId)}`)
      if (response.ok) {
        const responseData = await response.json()
        if (hasCollectionsProperty(responseData)) {
          setCollections(responseData.collections)
        }
      }
    } catch (error) {
      console.error("Error loading collections:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading collections...</p>
        </CardContent>
      </Card>
    )
  }

  if (collections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5" />
            Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This server hasn&apos;t been added to any public collections yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const publicCollections = collections.filter((c) => c.isPublic)
  const privateCollections = collections.filter((c) => !c.isPublic)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookmarkIcon className="h-5 w-5" />
          Collections ({collections.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {publicCollections.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Public Collections ({publicCollections.length})
            </h4>
            <div className="space-y-2">
              {publicCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collection/${collection.slug}`}
                  className="block p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm line-clamp-1">{collection.name}</h5>
                      {collection.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{collection.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{collection.owner.name || "Anonymous"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookmarkIcon className="h-3 w-3" />
                          <span>{collection._count.items} servers</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="shrink-0">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {privateCollections.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Your Private Collections ({privateCollections.length})
            </h4>
            <div className="space-y-2">
              {privateCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collection/${collection.slug}`}
                  className="block p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm line-clamp-1">{collection.name}</h5>
                      {collection.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{collection.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <BookmarkIcon className="h-3 w-3" />
                        <span>{collection._count.items} servers</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
