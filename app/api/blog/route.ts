import { auth } from "@/auth"
import { createAuthHandler, isUserAdmin } from "@/lib/auth"
import {
  createBlogPost,
  getBlogPosts,
  type BlogPostFilters,
  type CreateBlogPostData,
  type PaginationOptions,
} from "@/lib/blog"
import { createErrorResponse, createSuccessResponse } from "@/lib/error-handling"
import { getRequestContext, logger } from "@/lib/monitoring"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schema for blog post creation
const createBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  excerpt: z.string().max(500, "Excerpt must be 500 characters or less").optional(),
  content: z.string().min(1, "Content is required"),
  published: z.boolean().optional().default(false),
  metaTitle: z.string().max(200, "Meta title must be 200 characters or less").optional(),
  metaDescription: z.string().max(500, "Meta description must be 500 characters or less").optional(),
  keywords: z.array(z.string()).optional().default([]),
})

// GET /api/blog - Fetch blog posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    // Parse filter parameters
    const filters: BlogPostFilters = {}

    const publishedParam = searchParams.get("published")
    if (publishedParam !== null) {
      filters.published = publishedParam === "true"
    }

    const authorId = searchParams.get("authorId")
    if (authorId) {
      filters.authorId = authorId
    }

    const search = searchParams.get("search")
    if (search) {
      filters.search = search
    }

    // Check if user is authenticated and admin for unpublished posts
    const session = await auth()
    const isAdmin = session?.user?.id ? await isUserAdmin(session.user.id) : false

    // If not admin, only show published posts
    if (!isAdmin && filters.published === undefined) {
      filters.published = true
    }

    const pagination: PaginationOptions = { page, limit }
    const result = await getBlogPosts(filters, pagination)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 })
  }
}

// POST /api/blog - Create a new blog post (Admin only)
export const POST = createAuthHandler(async (request: NextRequest, user) => {
  const context = getRequestContext(request)
  logger.apiRequest("POST", "/api/blog", { ...context, userId: user.id })

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createBlogPostSchema.parse(body)

    // Create blog post
    const blogPostData: CreateBlogPostData = {
      ...validatedData,
      authorId: user.id,
    }

    const blogPost = await createBlogPost(blogPostData)

    logger.info("Blog post created", { blogPostId: blogPost.id, userId: user.id })

    return createSuccessResponse(
      {
        message: "Blog post created successfully",
        blogPost,
      },
      201,
    )
  } catch (error) {
    logger.error("Failed to create blog post", error as Error, { userId: user.id })
    return createErrorResponse(error, "Failed to create blog post")
  }
}, true)
