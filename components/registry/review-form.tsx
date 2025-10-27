"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ThumbsDown, ThumbsUp, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { hasErrorProperty } from "@/types/api"

const reviewFormSchema = z.object({
  name: z
    .string()
    .min(5, { message: "Review title must be at least 5 characters." })
    .max(100, { message: "Review title must not exceed 100 characters." }),
  reviewBody: z
    .string()
    .min(20, { message: "Review comment must be at least 20 characters." })
    .max(2000, { message: "Review comment must not exceed 2000 characters." }),
  isHelpful: z
    .boolean()
    .refine((val) => val !== undefined, { message: "Please select whether this server helped you." }),
})

type ReviewFormValues = z.infer<typeof reviewFormSchema>

interface ReviewFormProps {
  mcpServerId: string
  serverName: string
  onSuccess?: () => void
  existingReview?: {
    id: string
    name: string
    reviewBody: string
    isHelpful: boolean
    isPending: boolean
    isApproved: boolean
  } | null
}

export default function ReviewForm({ mcpServerId, serverName, onSuccess, existingReview }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      name: existingReview?.name || "",
      reviewBody: existingReview?.reviewBody || "",
      isHelpful: existingReview?.isHelpful,
    },
  })

  async function onSubmit(values: ReviewFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          mcpServerId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = hasErrorProperty(errorData) ? errorData.error : "Failed to submit review"
        throw new Error(errorMessage)
      }

      toast({
        title: existingReview ? "Review updated successfully!" : "Review submitted successfully!",
        description: existingReview
          ? existingReview.isApproved
            ? "Your updated review is pending admin approval and will be visible once re-approved."
            : "Your updated review is pending admin approval and will be visible once approved."
          : "Your review is pending admin approval and will be visible once approved.",
      })

      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteReview() {
    if (!existingReview?.id) return

    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/reviews?id=${existingReview.id}`, {
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

      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const renderVoteButtons = (isHelpful: boolean | undefined) => {
    return (
      <div className="flex space-x-4">
        <Button
          type="button"
          variant={isHelpful === true ? "default" : "outline"}
          size="lg"
          onClick={() => form.setValue("isHelpful", true)}
          className="flex items-center space-x-2"
        >
          <ThumbsUp className="w-5 h-5" />
          <span>Yes, it helped</span>
        </Button>
        <Button
          type="button"
          variant={isHelpful === false ? "default" : "outline"}
          size="lg"
          onClick={() => form.setValue("isHelpful", false)}
          className="flex items-center space-x-2"
        >
          <ThumbsDown className={`w-5 h-5`} />
          <span>No, it didn&apos;t help</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin approval notice - only show for new reviews */}
      {!existingReview && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/50 dark:border-yellow-700">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Review Moderation:</strong> All reviews require admin approval before being published. Your review
            will be visible to others once it has been reviewed and approved by our team.
          </p>
        </div>
      )}

      {existingReview && (
        <>
          {/* Review status indicator */}
          {existingReview.isPending && !existingReview.isApproved && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/50 dark:border-orange-700">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Review Status:</strong> Your review is currently pending admin approval. It will be visible to
                other users once approved.
              </p>
            </div>
          )}

          {existingReview.isApproved && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/50 dark:border-green-700">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Review Status:</strong> Your review has been approved and is visible to other users.
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/50 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Editing your review:</strong> You can update your existing review below or delete it if you prefer
              to start fresh. {existingReview.isApproved ? "Updated reviews will need to be re-approved." : ""}
            </p>
          </div>
        </>
      )}

      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">{existingReview ? "Update Your Review" : "Write a Review"}</h3>
        <p className="text-muted-foreground">
          {existingReview ? "Update your experience with" : "Share your experience with"}{" "}
          <span className="font-medium">{serverName}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="isHelpful"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Did this MCP server help you with your research?</FormLabel>
                <FormControl>
                  <div>{renderVoteButtons(field.value)}</div>
                </FormControl>
                <FormDescription>Let others know whether this server was helpful for your research</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Title</FormLabel>
                <FormControl>
                  <Input placeholder="Summarize your review in a few words..." {...field} />
                </FormControl>
                <FormDescription>Give your review a descriptive title</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reviewBody"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Comment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell others about your experience with this MCP server. What did you like? What could be improved?"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Share details about your experience (minimum 20 characters)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting
                ? existingReview
                  ? "Updating..."
                  : "Submitting..."
                : existingReview
                  ? "Update Review"
                  : "Submit Review"}
            </Button>

            {existingReview && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteReview}
                disabled={isSubmitting || isDeleting}
                className="ml-4"
              >
                {isDeleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Review
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
