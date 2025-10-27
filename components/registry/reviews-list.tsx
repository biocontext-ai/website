"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { type ReviewWithAuthor } from "@/lib/registry"
import { hasErrorProperty } from "@/types/api"
import { ThumbsDown, ThumbsUp, Trash2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ReviewsListProps {
  reviews: ReviewWithAuthor[]
  currentUserId?: string
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

const renderVote = (isHelpful: boolean) => {
  return (
    <div className="flex items-center space-x-1">
      {isHelpful ? (
        <>
          <ThumbsUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">Helpful</span>
        </>
      ) : (
        <>
          <ThumbsDown className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">Not helpful</span>
        </>
      )}
    </div>
  )
}

export default function ReviewsList({ reviews, currentUserId }: ReviewsListProps) {
  const [deletingReviews, setDeletingReviews] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const router = useRouter()

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return
    }

    setDeletingReviews((prev) => new Set(prev).add(reviewId))

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = hasErrorProperty(errorData) ? errorData.error : "Failed to delete review"
        throw new Error(errorMessage)
      }

      toast({
        title: "Review deleted successfully",
        description: "Your review has been removed.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingReviews((prev) => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} itemScope itemType="https://schema.org/Review">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.author.image || undefined} alt={review.author.name || "User"} />
                  <AvatarFallback>
                    {review.author.name ? review.author.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium" itemProp="author" itemScope itemType="https://schema.org/Person">
                    <span itemProp="name">{review.author.name || "Anonymous User"}</span>
                  </p>
                  <div className="flex items-center gap-2">{renderVote(review.isHelpful)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {currentUserId === review.author.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={deletingReviews.has(review.id)}
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    title="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={review.datePublished.toISOString()}
                  itemProp="datePublished"
                  content={review.datePublished.toISOString()}
                >
                  {formatDate(review.datePublished)}
                </time>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <h4 className="font-semibold text-lg" itemProp="name">
              {review.name}
            </h4>
            <p className="text-muted-foreground leading-relaxed" itemProp="reviewBody">
              {review.reviewBody}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
