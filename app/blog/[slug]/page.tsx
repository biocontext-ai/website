import { auth } from "@/auth"
import DeleteBlogPostButton from "@/components/blog/delete-blog-post-button"
import Markdown from "@/components/markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { isUserAdmin } from "@/lib/auth"
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/blog"
import { format } from "date-fns"
import { ArrowLeft, CalendarDays, Clock, Edit, Tag, User } from "lucide-react"
import { Metadata } from "next"
import { cacheLife, cacheTag } from "next/cache"
import Link from "next/link"
import { notFound } from "next/navigation"

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCachedBlogPost(slug: string, isAdmin: boolean) {
  "use cache"
  cacheLife("hours")
  cacheTag("blog:post")

  return getBlogPostBySlug(slug, isAdmin)
}

async function getCachedRelatedPosts(postId: string, keywords: string[], limit: number) {
  "use cache"
  cacheLife("hours")
  cacheTag("blog:post")

  return getRelatedBlogPosts(postId, keywords, limit)
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const session = await auth()
  const isAdmin = session?.user?.id ? await isUserAdmin(session.user.id) : false
  const post = await getCachedBlogPost(slug, isAdmin)

  if (!post) {
    return {
      title: "Blog Post Not Found",
    }
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    keywords: post.keywords,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      type: "article",
      publishedTime: post.publishedAt ? post.publishedAt.toISOString() : undefined,
      authors: [post.author.name || post.author.email],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
    },
  }
}

async function RelatedPosts({ currentPostId, keywords }: { currentPostId: string; keywords: string[] }) {
  const relatedPosts = await getCachedRelatedPosts(currentPostId, keywords, 3)

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <Card className="shadow-sm bg-gradient-to-br from-accent/80 to-accent/50">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl">Related Posts</CardTitle>
        <CardDescription>Discover more content you might find interesting</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {relatedPosts.map((post) => (
            <Card
              key={post.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-background/80 backdrop-blur"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base leading-tight">
                  <Link href={`/blog/${post.slug}`} className="group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </Link>
                </CardTitle>
                {post.excerpt && (
                  <CardDescription className="line-clamp-3 text-sm leading-relaxed">{post.excerpt}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-20">{post.author.name || post.author.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>
                      {post.publishedAt
                        ? format(new Date(post.publishedAt), "MMM d")
                        : format(new Date(post.createdAt), "MMM d")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const session = await auth()
  const isAdmin = session?.user?.id ? await isUserAdmin(session.user.id) : false

  const post = await getCachedBlogPost(slug, isAdmin)

  if (!post) {
    notFound()
  }

  // If post is not published and user is not admin, show not found
  if (!post.published && !isAdmin) {
    notFound()
  }

  const readingTime = Math.ceil(post.content.split(" ").length / 200)

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-[4.025rem] z-50">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="hover:bg-accent" asChild>
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="bg-background" asChild>
                  <Link href={`/blog/edit/${post.id}`}>
                    <Edit className="h-4 w-4" />
                    Edit Post
                  </Link>
                </Button>
                <DeleteBlogPostButton postId={post.id} postTitle={post.title} variant="outline" size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Article Header Card */}
        <Card className="mb-8 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight flex items-center gap-4">
              {post.title}
              {!post.published && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  Draft
                </Badge>
              )}
            </CardTitle>

            {post.excerpt && (
              <CardDescription className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </CardDescription>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 bg-accent/50 px-3 py-1 rounded-full">
                <User className="h-4 w-4" />
                <span className="font-medium">{post.author.name || post.author.email}</span>
              </div>
              <div className="flex items-center space-x-2 bg-accent/50 px-3 py-1 rounded-full">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), "MMMM d, yyyy")
                    : format(new Date(post.createdAt), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-accent/50 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </CardHeader>

          <Separator className="my-4" />

          <CardContent className="pb-8">
            <div className="prose prose-gray max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-l-primary prose-blockquote:bg-accent/20 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg">
              <Markdown>{post.content}</Markdown>
            </div>
          </CardContent>
        </Card>

        {/* Keywords Card */}
        {post.keywords.length > 0 && (
          <Card className="mb-8 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                  #
                </Badge>
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" itemProp="keywords">
                    <Tag className="w-3 h-3 mr-1" />
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Posts */}
        <RelatedPosts currentPostId={post.id} keywords={post.keywords} />
      </div>
    </div>
  )
}
