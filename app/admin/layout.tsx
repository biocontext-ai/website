import { auth } from "@/auth"
import { isUserAdmin } from "@/lib/auth"
import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Administrative tools and user management",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <div className="h-6 w-px bg-border" />
              <nav className="flex space-x-4">
                <Link
                  href="/admin/user"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  User Management
                </Link>
                <Link
                  href="/admin/reviews"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Review Management
                </Link>
                <Link
                  href="/admin/reports"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/stats"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Statistics
                </Link>
              </nav>
            </div>
            <div className="text-sm text-muted-foreground">Logged in as {session.user.name || session.user.email}</div>
          </div>
        </div>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  )
}
