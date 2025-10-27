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
import { hasCollectionProperty } from "@/types/api"
import { Collection } from "@prisma/client"
import { X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

interface CreateCollectionDialogProps {
  children: React.ReactNode
  onCollectionCreated?: (collection: Collection) => void
}

export default function CreateCollectionDialog({ children, onCollectionCreated }: CreateCollectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { data: session } = useSession()
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.id) {
      toast.error("You must be signed in to create a collection")
      return
    }

    if (!name.trim()) {
      toast.error("Collection name is required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
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
        throw new Error("Failed to create collection")
      }

      const responseData = await response.json()

      if (!hasCollectionProperty(responseData)) {
        throw new Error("Invalid response format")
      }

      const { collection } = responseData

      toast.success("Collection created successfully!")
      setOpen(false)

      // Reset form
      setName("")
      setDescription("")
      setIsPublic(false)
      setKeywords([])
      setKeywordInput("")

      // Call the callback to notify parent component
      onCollectionCreated?.(collection)

      // Refresh the page to show the new collection
      router.refresh()

      // window.location.reload()
    } catch (error) {
      console.error("Error creating collection:", error)
      toast.error("Failed to create collection. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>Create a new collection to organize your saved MCP servers.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

            <p className="text-xs text-muted-foreground">
              Keywords help others discover your public collections. Maximum 10 keywords.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public" className="text-sm">
              Make this collection public
            </Label>
          </div>

          {isPublic && (
            <p className="text-xs text-muted-foreground">
              Public collections can be discovered and viewed by other users.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
