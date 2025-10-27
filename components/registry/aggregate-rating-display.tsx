import { AggregateRating } from "@/lib/registry"
import { ThumbsUp } from "lucide-react"

interface AggregateRatingDisplayProps {
  aggregateRating: AggregateRating
  serverName: string
}

export function AggregateRatingDisplay({ aggregateRating, serverName }: AggregateRatingDisplayProps) {
  const { netVotes, helpfulCount, unhelpfulCount, totalReviews } = aggregateRating

  if (totalReviews === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <ThumbsUp className="h-4 w-4 text-gray-300" />
          <span>No reviews yet</span>
        </div>
      </div>
    )
  }

  // Calculate a rating value for schema.org (0-100 scale based on helpfulness percentage)
  const helpfulPercentage = totalReviews > 0 ? Math.round((helpfulCount / totalReviews) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1"
        itemProp="aggregateRating"
        itemScope
        itemType="https://schema.org/AggregateRating"
      >
        <div className="flex items-center gap-1">
          <ThumbsUp className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-700">{netVotes}</span>
        </div>
        <span className="text-sm font-normal text-muted-foreground">
          ({totalReviews} review{totalReviews !== 1 ? "s" : ""}, {helpfulPercentage}% helpful)
        </span>

        {/* Schema.org metadata - hidden from users but visible to search engines */}
        <meta itemProp="ratingCount" content={totalReviews.toString()} />
        <meta itemProp="bestRating" content="100" />
        <meta itemProp="worstRating" content="0" />
        <meta itemProp="ratingValue" content={helpfulPercentage.toString()} />
        {/* Reference to the item being rated */}
        <span
          itemProp="itemReviewed"
          itemScope
          itemType="https://schema.org/SoftwareApplication"
          style={{ display: "none" }}
        >
          <meta itemProp="name" content={serverName} />
        </span>
      </div>
    </div>
  )
}
