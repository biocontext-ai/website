import { auth } from "@/auth"
import { isUserAdmin } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import UserList from "./UserList"

export const metadata: Metadata = {
  title: "User Management - Admin",
  description: "Manage community members and their access",
}

export default async function AdminUserPage() {
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
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage community members, their roles, and access permissions.</p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <UserList />
      </Suspense>
    </div>
  )
}
