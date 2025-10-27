import { auth } from "@/auth"
import AdminReviewsList from "@/components/admin/admin-reviews-list"
import { isUserAdmin } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Review Management - Admin",
  description: "Manage community reviews and approve or moderate content",
}

export default async function AdminReviewsPage() {
  const session = await auth()

  // Check if user is authenticated
  if (!session?.user?.id) {
    redirect("/signin")
  }

  // Check if user is admin
  const adminStatus = await isUserAdmin(session.user.id)
  if (!adminStatus) {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Review Management</h1>
        <p className="text-muted-foreground">
          Review and moderate community feedback. Approve helpful reviews or remove inappropriate content.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Pending Reviews</h3>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          These reviews are waiting for admin approval before being displayed publicly.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <AdminReviewsList showOnlyPending={true} />
      </Suspense>
    </div>
  )
}
