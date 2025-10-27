"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CollectionWithItems, CollectionWithOwner } from "@/lib/collections"
import { hasCollectionProperty, hasErrorProperty } from "@/types/api"
import { Trash2, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface EditCollectionDialogProps {
  children: React.ReactNode
  collection: CollectionWithItems | CollectionWithOwner
  onUpdate?: () => void
}

export default function EditCollectionDialog({ children, collection, onUpdate }: EditCollectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description || "")
  const [isPublic, setIsPublic] = useState(collection.isPublic)
  const [keywords, setKeywords] = useState<string[]>(collection.keywords || [])
  const [keywordInput, setKeywordInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: session } = useSession()
  const router = useRouter()

  // Reset form when collection changes
  useEffect(() => {
    setName(collection.name)
    setDescription(collection.description || "")
    setIsPublic(collection.isPublic)
    setKeywords(collection.keywords || [])
  }, [collection])

  const handleAddKeyword = () => {
    const trimmedKeyword = keywordInput.trim()
    if (trimmedKeyword && !keywords.includes(trimmedKeyword) && keywords.length < 10) {
      setKeywords([...keywords, trimmedKeyword])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== keywordToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.id) {
      toast.error("You must be signed in to edit collections")
      return
    }

    if (!name.trim()) {
      toast.error("Collection name is required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          keywords,
          isPublic,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = hasErrorProperty(error) ? error.error : "Failed to update collection"
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      if (!hasCollectionProperty(responseData)) {
        throw new Error("Invalid response format")
      }

      const { collection: updatedCollection } = responseData

      toast.success("Collection updated successfully!")
      setOpen(false)

      // Call the update callback
      if (onUpdate) {
        onUpdate()
      }

      // If the slug changed, redirect to the new URL
      if (updatedCollection.slug !== collection.slug) {
        router.push(`/collection/${updatedCollection.slug}`)
      } else {
        // Otherwise just refresh the current page
        router.refresh()
      }
    } catch (error) {
      console.error("Error updating collection:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update collection")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!session?.user?.id) {
      toast.error("You must be signed in to delete collections")
      return
    }

    if (collection.isDefault) {
      toast.error("Cannot delete default collection")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = hasErrorProperty(error) ? error.error : "Failed to delete collection"
        throw new Error(errorMessage)
      }

      toast.success("Collection deleted successfully!")
      setOpen(false)

      // Redirect to collections page
      router.push("/collection")
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete collection")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>Update your collection details and settings.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Healthcare Tools"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this collection is about..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Keywords (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a keyword"
                maxLength={30}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim() || keywords.length >= 10}
              >
                Add
              </Button>
            </div>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public" className="text-sm">
              Make this collection public
            </Label>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {!collection.isDefault && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? "Updating..." : "Update Collection"}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-background border rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Collection</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete &quot;{collection.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
                  {isLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
