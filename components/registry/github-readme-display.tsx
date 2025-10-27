import Markdown from "@/components/markdown"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, FileText } from "lucide-react"

interface GitHubReadmeProps {
  readmeData?: {
    content: string
    encoding: string
    sha: string | null
    lastChecked: Date
  } | null
  repositoryUrl: string
  isLoading?: boolean
}

// Helper function to decode base64 content
function decodeReadmeContent(content: string, encoding: string): string {
  try {
    if (encoding === "base64") {
      // Use proper UTF-8 decoding instead of atob()
      const binaryString = atob(content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const decoded = new TextDecoder("utf-8").decode(bytes)

      return decoded
    }
    return content
  } catch (error) {
    console.error("Error decoding README content:", error)
    return "Error decoding README content"
  }
}

// Format date for display
function formatLastChecked(date: Date): string {
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "Unknown"
  }
}

export function GitHubReadmeDisplay({ readmeData, repositoryUrl, isLoading = false }: GitHubReadmeProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            README
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!readmeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            README
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">README not available for this repository.</p>
        </CardContent>
      </Card>
    )
  }

  const decodedContent = decodeReadmeContent(readmeData.content, readmeData.encoding)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            README
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {formatLastChecked(readmeData.lastChecked)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted/50 rounded-md border border-muted">
          <p className="text-xs text-muted-foreground lg:text-justify">
            <span className="font-medium">Disclaimer:</span> This README was automatically included and may be out of
            date. It is shown for information purposes for scientific research only and remains the property of the
            repository owner.
          </p>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Markdown repositoryUrl={repositoryUrl}>{decodedContent}</Markdown>
        </div>
      </CardContent>
    </Card>
  )
}
