import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { BlogPost } from "@prisma/client"
import "server-only"

// Types for blog operations
export type BlogPostWithAuthor = BlogPost & {
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export type CreateBlogPostData = {
  title: string
  excerpt?: string
  content: string
  published?: boolean
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  authorId: string
}

export type UpdateBlogPostData = Partial<CreateBlogPostData> & {
  publishedAt?: Date | null
}

export type BlogPostFilters = {
  published?: boolean
  authorId?: string
  search?: string
}

export type PaginationOptions = {
  page: number
  limit: number
}

export type BlogPostsResult = {
  posts: BlogPostWithAuthor[]
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Get blog posts with pagination and filtering
 */
export async function getBlogPosts(
  filters: BlogPostFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 10 },
): Promise<BlogPostsResult> {
  const { published, authorId, search } = filters
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (typeof published === "boolean") {
    where.published = published
  }

  if (authorId) {
    where.authorId = authorId
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { keywords: { has: search } },
    ]
  }

  // Get total count for pagination
  const totalCount = await prisma.blogPost.count({ where })
  const totalPages = Math.ceil(totalCount / limit)

  // Get posts with author info
  const posts = await prisma.blogPost.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip,
    take: limit,
  })

  return {
    posts,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string, includeUnpublished = false): Promise<BlogPostWithAuthor | null> {
  const where: any = { slug }

  if (!includeUnpublished) {
    where.published = true
  }

  return await prisma.blogPost.findUnique({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: string, includeUnpublished = false): Promise<BlogPostWithAuthor | null> {
  const where: any = { id }

  if (!includeUnpublished) {
    where.published = true
  }

  return await prisma.blogPost.findUnique({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: CreateBlogPostData): Promise<BlogPost> {
  const slug = await generateUniqueSlug(data.title)
  const publishedAt = data.published ? new Date() : null

  return await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      published: data.published ?? false,
      publishedAt,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords ?? [],
      authorId: data.authorId,
    },
  })
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(id: string, data: UpdateBlogPostData): Promise<BlogPost> {
  const updateData: any = { ...data }

  // Generate new slug if title changed
  if (data.title) {
    updateData.slug = await generateUniqueSlug(data.title, id)
  }

  // Set publishedAt when publishing for the first time
  if (data.published && !data.publishedAt) {
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { published: true, publishedAt: true },
    })

    if (!existingPost?.published && !existingPost?.publishedAt) {
      updateData.publishedAt = new Date()
    }
  }

  // Clear publishedAt when unpublishing
  if (data.published === false) {
    updateData.publishedAt = null
  }

  return await prisma.blogPost.update({
    where: { id },
    data: updateData,
  })
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<void> {
  await prisma.blogPost.delete({
    where: { id },
  })
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const whereClause = excludeId ? { slug, NOT: { id: excludeId } } : { slug }

  const existingPost = await prisma.blogPost.findMany({
    where: whereClause,
    select: { id: true },
  })

  return existingPost.length === 0
}

/**
 * Generate a unique slug for a blog post
 */
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  const maxCount = 100
  while (!(await isSlugAvailable(slug, excludeId)) && counter <= maxCount) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  if (counter > maxCount) {
    slug = `${baseSlug}-${Date.now()}` // Fallback to timestamp if too many conflicts
  }

  return slug
}

/**
 * Get recent blog posts for sidebar/recommendations
 */
export async function getRecentBlogPosts(limit = 5): Promise<BlogPostWithAuthor[]> {
  return await prisma.blogPost.findMany({
    where: { published: true },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  })
}

/**
 * Get related blog posts based on keywords
 */
export async function getRelatedBlogPosts(
  currentPostId: string,
  keywords: string[],
  limit = 3,
): Promise<BlogPostWithAuthor[]> {
  if (keywords.length === 0) {
    return []
  }

  return await prisma.blogPost.findMany({
    where: {
      id: { not: currentPostId },
      published: true,
      keywords: {
        hasSome: keywords,
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  })
}
