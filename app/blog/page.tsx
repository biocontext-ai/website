import { auth } from "@/auth"
import BlogSearchInput from "@/components/blog/blog-search-input"
import DeleteBlogPostButton from "@/components/blog/delete-blog-post-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { isUserAdmin } from "@/lib/auth"
import { getBlogPosts } from "@/lib/blog"
import { format } from "date-fns"
import { CalendarDays, Clock, Edit, PlusCircle, User } from "lucide-react"
import type { Metadata } from "next"
import { cacheLife, cacheTag } from "next/cache"
import Link from "next/link"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Blog | BioContextAI",
  description:
    "Read the latest news, updates, and insights about biomedical Model Context Protocol servers, AI-driven research tools, and the BioContextAI community.",
  keywords: [
    "BioContextAI blog",
    "MCP news",
    "biomedical AI updates",
    "research software",
    "computational biology",
    "bioinformatics",
    "AI in healthcare",
    "Model Context Protocol",
  ],
  openGraph: {
    title: "Blog | BioContextAI",
    description: "Latest news and insights about biomedical MCP servers and AI-driven research tools",
    type: "website",
  },
}

interface BlogPageSearchParams {
  page?: string
  search?: string
}

async function getCachedBlogPosts(
  filters: Parameters<typeof getBlogPosts>[0],
  pagination: Parameters<typeof getBlogPosts>[1],
) {
  "use cache"
  cacheLife("hours")
  cacheTag("blog:list")

  return getBlogPosts(filters, pagination)
}

function BlogPostsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function BlogPostsList({ page, search }: { page: number; search?: string }) {
  const session = await auth()
  const isAdmin = session?.user?.id ? await isUserAdmin(session.user.id) : false

  const result = await getCachedBlogPosts(
    {
      published: !isAdmin ? true : undefined,
      search,
    },
    { page, limit: 10 },
  )

  const { posts, totalPages, currentPage, hasNextPage, hasPreviousPage } = result

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-muted-foreground">
          {search ? "No blog posts found matching your search." : "No blog posts available yet."}
        </h3>
        {search && (
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search terms or{" "}
            <Link href="/blog" className="text-primary hover:underline">
              view all posts
            </Link>
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {posts.map((post) => (
          <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 hover:bg-card/80 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl md:text-2xl leading-tight group-hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug}`} className="line-clamp-2">
                        {post.title}
                      </Link>
                    </CardTitle>
                    {!post.published && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      >
                        Draft
                      </Badge>
                    )}
                  </div>
                  {post.excerpt && (
                    <CardDescription className="text-base leading-relaxed line-clamp-3">{post.excerpt}</CardDescription>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/blog/edit/${post.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteBlogPostButton postId={post.id} postTitle={post.title} variant="ghost" size="icon" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2 bg-accent/50 px-3 py-1 rounded-full">
                  <User className="h-3 w-3" />
                  <span className="font-medium">{post.author.name || post.author.email}</span>
                </div>
                <div className="flex items-center space-x-2 bg-accent/50 px-3 py-1 rounded-full">
                  <CalendarDays className="h-3 w-3" />
                  <span>
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "MMM d, yyyy")
                      : format(new Date(post.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-accent/50 px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3" />
                  <span>{Math.ceil(post.content.split(" ").length / 200)} min read</span>
                </div>
              </div>
              {post.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.keywords.slice(0, 5).map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="text-xs bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                    >
                      {keyword}
                    </Badge>
                  ))}
                  {post.keywords.length > 5 && (
                    <Badge variant="outline" className="text-xs bg-accent/50">
                      +{post.keywords.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              {hasPreviousPage && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/blog?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={`/blog?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {hasNextPage && (
                <PaginationItem>
                  <PaginationNext
                    href={`/blog?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  )
}

export default async function BlogPage(props: { searchParams: Promise<BlogPageSearchParams> }) {
  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || "1", 10)
  const search = searchParams.search

  const session = await auth()
  const isAdmin = session?.user?.id ? await isUserAdmin(session.user.id) : false

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-lg text-muted-foreground mt-2">Insights, tutorials, and updates from our team</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/blog/create">
              <PlusCircle className="h-4 w-4" />
              New Post
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6">
        <BlogSearchInput />
      </div>

      <Suspense fallback={<BlogPostsSkeleton />}>
        <BlogPostsList page={page} search={search} />
      </Suspense>
    </div>
  )
}
