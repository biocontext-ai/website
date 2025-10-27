import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isUserAdmin } from "@/lib/auth"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import DataExportSection from "./data-export-section"
import DeleteAccountSection from "./delete-account-section"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings",
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/signin")
  }

  const isAdmin = await isUserAdmin(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-muted-foreground">{session.user.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-muted-foreground">{session.user.email}</p>
              </div>
            </CardContent>
          </Card>

          <DataExportSection />

          {!isAdmin && <DeleteAccountSection />}
        </div>
      </div>
    </div>
  )
}
