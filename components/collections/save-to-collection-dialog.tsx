"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { hasCollectionsProperty } from "@/types/api"
import { Collection } from "@prisma/client"
import { BookmarkIcon, PlusCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import CreateCollectionDialog from "./create-collection-dialog"

interface CollectionWithCount extends Collection {
  isDefault: boolean
  containsServer?: boolean
  _count: {
    items: number
  }
}

interface SaveToCollectionDialogProps {
  children: React.ReactNode
  mcpServerId: string
  serverName: string
}

export default function SaveToCollectionDialog({ children, mcpServerId, serverName }: SaveToCollectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<CollectionWithCount[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [initiallySelectedCollections, setInitiallySelectedCollections] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCollections, setLoadingCollections] = useState(true)

  const { data: session } = useSession()

  useEffect(() => {
    if (open && session?.user?.id) {
      loadCollections()
    }
  }, [open, session?.user?.id])

  const loadCollections = async () => {
    if (!session?.user?.id) return

    setLoadingCollections(true)
    try {
      const response = await fetch(
        `/api/collections/user-with-server-status?mcpServerId=${encodeURIComponent(mcpServerId)}`,
      )
      if (!response.ok) {
        throw new Error("Failed to fetch collections")
      }

      const responseData = await response.json()

      if (!hasCollectionsProperty(responseData)) {
        throw new Error("Invalid response format")
      }

      const { collections: userCollections } = responseData
      setCollections(userCollections)

      // Pre-select collections that already contain this server
      const alreadySelectedCollections = userCollections
        .filter((c: CollectionWithCount) => c.containsServer)
        .map((c: CollectionWithCount) => c.id)

      setSelectedCollections(alreadySelectedCollections)
      setInitiallySelectedCollections(alreadySelectedCollections)

      // If no collections are pre-selected, pre-select default collection
      if (alreadySelectedCollections.length === 0) {
        const defaultCollection = userCollections.find((c: CollectionWithCount) => c.isDefault)
        if (defaultCollection) {
          setSelectedCollections([defaultCollection.id])
        }
      }
    } catch (error) {
      console.error("Error loading collections:", error)
      toast.error("Failed to load collections")
    } finally {
      setLoadingCollections(false)
    }
  }

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId) ? prev.filter((id) => id !== collectionId) : [...prev, collectionId],
    )
  }

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error("You must be signed in to save servers")
      return
    }

    setIsLoading(true)

    try {
      // Determine which collections to add to and remove from
      const collectionsToAdd = selectedCollections.filter((id) => !initiallySelectedCollections.includes(id))
      const collectionsToRemove = initiallySelectedCollections.filter((id) => !selectedCollections.includes(id))

      // Handle removals first
      if (collectionsToRemove.length > 0) {
        await Promise.all(
          collectionsToRemove.map(async (collectionId) => {
            const response = await fetch(
              `/api/collections/items?mcpServerId=${encodeURIComponent(mcpServerId)}&collectionId=${encodeURIComponent(collectionId)}`,
              {
                method: "DELETE",
              },
            )
            if (!response.ok) {
              throw new Error(`Failed to remove from collection ${collectionId}`)
            }
          }),
        )
      }

      // Handle additions (only if there are collections to add to)
      if (collectionsToAdd.length > 0) {
        const response = await fetch("/api/collections/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mcpServerId,
            collectionIds: collectionsToAdd,
            notes: notes.trim() || undefined,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add to collections")
        }
      }

      // If no collections are selected, handle complete removal
      if (selectedCollections.length === 0) {
        toast.success(`Removed "${serverName}" from all collections`)
      } else {
        const selectedCollectionNames = collections.filter((c) => selectedCollections.includes(c.id)).map((c) => c.name)
        toast.success(
          `Updated "${serverName}" in ${selectedCollectionNames.length} collection${selectedCollectionNames.length !== 1 ? "s" : ""}`,
        )
      }

      setOpen(false)
      setSelectedCollections([])
      setInitiallySelectedCollections([])
      setNotes("")
    } catch (error) {
      console.error("Error updating collections:", error)
      toast.error("Failed to update collections. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCollectionCreated = (newCollection: Collection) => {
    // Refresh collections immediately when a new one is created
    loadCollections().then(() => {
      // Auto-select the newly created collection
      setSelectedCollections((prev) => [...prev, newCollection.id])
    })
  }

  if (!session?.user) {
    return (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>You need to sign in to save MCP servers to collections.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
          <DialogDescription>
            Add or remove &quot;{serverName}&quot; from your collections to organize and find it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Collections</Label>
              <CreateCollectionDialog onCollectionCreated={handleCollectionCreated}>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Collection
                </Button>
              </CreateCollectionDialog>
            </div>

            {loadingCollections ? (
              <div className="text-center py-4 text-muted-foreground">Loading collections...</div>
            ) : collections.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {collections.map((collection) => (
                  <div key={collection.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={collection.id}
                      className="mt-2"
                      checked={selectedCollections.includes(collection.id)}
                      onCheckedChange={() => handleCollectionToggle(collection.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={collection.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {collection.name}
                        {collection.isDefault && <span className="ml-2 text-xs text-muted-foreground">(Default)</span>}
                        {collection.containsServer && (
                          <span className="ml-2 text-xs text-blue-600 font-medium">✓ Already added</span>
                        )}
                      </label>
                      {collection.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{collection.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {collection._count.items} server{collection._count.items !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <BookmarkIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">You don&apos;t have any collections yet.</p>
                <CreateCollectionDialog onCollectionCreated={handleCollectionCreated}>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Button>
                </CreateCollectionDialog>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about why you saved this server..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || loadingCollections}>
            {isLoading
              ? "Updating..."
              : selectedCollections.length === 0
                ? "Remove from collections"
                : "Update Collections"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
