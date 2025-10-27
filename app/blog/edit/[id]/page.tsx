import { auth } from "@/auth"
import BlogForm from "@/components/blog/blog-form"
import { isUserAdmin } from "@/lib/auth"
import { getBlogPostById } from "@/lib/blog"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Edit Blog Post | BioContextAI",
  description: "Edit blog post",
  robots: {
    index: false,
    follow: false,
  },
}

interface EditBlogPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/blog/edit/" + id)
  }

  const isAdmin = await isUserAdmin(session.user.id)
  if (!isAdmin) {
    redirect("/blog")
  }

  const blogPost = await getBlogPostById(id, true)
  if (!blogPost) {
    notFound()
  }

  return (
    <BlogForm
      initialData={{
        id: blogPost.id,
        title: blogPost.title,
        excerpt: blogPost.excerpt || "",
        content: blogPost.content,
        published: blogPost.published,
        metaTitle: blogPost.metaTitle || "",
        metaDescription: blogPost.metaDescription || "",
        keywords: blogPost.keywords,
      }}
      isEditing={true}
    />
  )
}
