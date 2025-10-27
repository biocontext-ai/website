import { auth } from "@/auth"
import BlogForm from "@/components/blog/blog-form"
import { isUserAdmin } from "@/lib/auth"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Create Blog Post | BioContextAI",
  description: "Create a new blog post for the BioContextAI community",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CreateBlogPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/blog/create")
  }

  const isAdmin = await isUserAdmin(session.user.id)
  if (!isAdmin) {
    redirect("/blog")
  }

  return <BlogForm />
}
