import AdminStats from "@/components/admin/admin-stats"

export default function AdminStatsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground mt-2">Overview of chat usage and MCP server activity</p>
      </div>
      <AdminStats />
    </div>
  )
}
