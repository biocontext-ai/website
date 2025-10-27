"use client"

import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader } from "../ui/card"

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

interface ReportWithDetails {
  id: string
  reason: string
  explanation: string
  createdAt: string
  mcpServer: {
    id: string
    name: string
    identifier: string
  }
}

export default function AdminReportsList() {
  const [reports, setReports] = useState<ReportWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/admin/reports")
      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }
      const data = (await response.json()) as { reports: ReportWithDetails[] }

      setReports(data.reports || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch reports.",
        variant: "destructive",
      })
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleDismissReport = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/dismiss`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to dismiss report")
      }

      toast({
        title: "Success",
        description: "Report dismissed successfully",
      })

      // Refresh the reports list
      await fetchReports()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dismiss report",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteServer = async (reportId: string, serverIdentifier: string, serverName: string) => {
    setActionLoading(reportId)
    try {
      const response = await fetch(`/api/registry/${encodeURIComponent(serverIdentifier)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete server")
      }

      toast({
        title: "Success",
        description: `Server "${serverName}" deleted successfully`,
      })

      // Refresh the reports list
      await fetchReports()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete server",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No reports found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    For: <span className="font-medium">{report.mcpServer.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <h4 className="font-semibold text-lg">{report.reason}</h4>
            <p className="text-muted-foreground leading-relaxed">{report.explanation}</p>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDismissReport(report.id)}
                disabled={actionLoading === report.id}
              >
                <CheckCircle className="h-4 w-4" />
                Dismiss Report
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={actionLoading === report.id}>
                    <Trash2 className="h-4 w-4" />
                    Delete Server
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete MCP Server</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete <strong>{report.mcpServer.name}</strong>? This action
                      cannot be undone and will remove the server from the registry along with all its reviews and data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteServer(report.id, report.mcpServer.identifier, report.mcpServer.name)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Server
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
