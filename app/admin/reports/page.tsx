import { auth } from "@/auth"
import AdminReportsList from "@/components/admin/admin-reports-list"
import { isUserAdmin } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Report Management - Admin",
  description: "Handle reported MCP servers.",
}

export default async function AdminReportsPage() {
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
        <h1 className="text-3xl font-bold mb-2">Report Management</h1>
        <p className="text-muted-foreground">Handle reported MCP servers.</p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Pending Reports</h3>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <AdminReportsList />
      </Suspense>
    </div>
  )
}
