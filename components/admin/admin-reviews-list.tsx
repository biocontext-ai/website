"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { hasErrorProperty } from "@/types/api"
import { Check, Loader2, ThumbsDown, ThumbsUp, Trash2, User, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ReviewWithDetails {
  id: string
  name: string
  reviewBody: string
  isHelpful: boolean
  datePublished: string
  isPending: boolean
  isApproved: boolean
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  mcpServer: {
    id: string
    name: string
    identifier: string
  }
}

interface AdminReviewsListProps {
  showOnlyPending?: boolean
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export default function AdminReviewsList({ showOnlyPending = true }: AdminReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/admin/reviews")
      if (!response.ok) {
        throw new Error("Failed to fetch reviews")
      }
      const data = (await response.json()) as { reviews: ReviewWithDetails[] }

      let reviewsList = data.reviews || []

      // Filter to only pending reviews if requested
      if (showOnlyPending) {
        reviewsList = reviewsList.filter((review: ReviewWithDetails) => review.isPending)
      }

      setReviews(reviewsList)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReviewAction = async (reviewId: string, action: "approve" | "delete" | "delete_and_block") => {
    setActionLoading(reviewId)
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          action,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = hasErrorProperty(errorData) ? errorData.error : "Failed to process review action"
        throw new Error(errorMessage)
      }

      const result = (await response.json()) as { message: string }

      toast({
        title: "Success",
        description: result.message,
      })

      // Refresh the reviews list
      await fetchReviews()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process review action",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [showOnlyPending])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {showOnlyPending ? "No pending reviews to approve." : "No reviews found."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.author.image || undefined} alt={review.author.name || "User"} />
                  <AvatarFallback>
                    {review.author.name ? review.author.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{review.author.name || "Anonymous User"}</p>
                    <span className="text-sm text-muted-foreground">({review.author.email})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {review.isHelpful ? (
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-700">Helpful</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">Not helpful</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For: <span className="font-medium">{review.mcpServer.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(review.datePublished)}</p>
                </div>
              </div>

              {review.isPending && (
                <div className="flex items-center space-x-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewAction(review.id, "approve")}
                    disabled={actionLoading === review.id}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewAction(review.id, "delete")}
                    disabled={actionLoading === review.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewAction(review.id, "delete_and_block")}
                    disabled={actionLoading === review.id}
                    className="text-red-800 hover:text-red-900 hover:bg-red-100"
                  >
                    <UserX className="h-4 w-4" />
                    Delete & Block User
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <h4 className="font-semibold text-lg">{review.name}</h4>
            <p className="text-muted-foreground leading-relaxed">{review.reviewBody}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
