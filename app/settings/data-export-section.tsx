"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function DataExportSection() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await fetch("/api/user/export")

      if (!response.ok) {
        throw new Error("Failed to export data")
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `user-data-export-${new Date().toISOString().split("T")[0]}.json`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Your data has been exported successfully")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Your Data</CardTitle>
        <CardDescription>Download a copy of all your personal data in JSON format</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This export includes your profile information, reviews, collections, blog posts, and all associated data
            stored in our system. Please note that chat messages are stored locally in your browser and are not included
            in this export.
          </p>
          <Button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export My Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
