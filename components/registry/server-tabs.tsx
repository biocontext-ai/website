"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

interface ServerTabsProps {
  hasTools: boolean
  toolsCount?: number
  reviewsCount: number
  children: ReactNode
}

export function ServerTabs({ hasTools, toolsCount, reviewsCount, children }: ServerTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  // Determine valid tabs based on available content
  const validTabs = ["readme", ...(hasTools ? ["tools"] : []), "reviews"]

  // Set default tab based on URL or fallback to readme
  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam
    }
    return "readme"
  })

  // Sync with URL changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    } else if (!tabParam && activeTab !== "readme") {
      // If no tab param and not on default, update state to default
      setActiveTab("readme")
    }
  }, [tabParam, validTabs, activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Update URL with new tab parameter
    const newSearchParams = new URLSearchParams(searchParams.toString())

    if (value === "readme") {
      // Remove tab param for default tab
      newSearchParams.delete("tab")
    } else {
      newSearchParams.set("tab", value)
    }

    const newUrl = newSearchParams.toString() ? `${pathname}?${newSearchParams.toString()}` : pathname

    router.push(newUrl, { scroll: false })
  }

  // Calculate grid columns based on available tabs
  const gridCols = hasTools ? "grid-cols-3" : "grid-cols-2"

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className={`grid w-full ${gridCols}`}>
        <TabsTrigger value="readme">README</TabsTrigger>
        {hasTools && (
          <TabsTrigger value="tools" className="relative">
            Tools
            {toolsCount !== undefined && toolsCount > 0 && (
              <Badge variant="outline" className="ml-2 text-xs">
                {toolsCount}
              </Badge>
            )}
          </TabsTrigger>
        )}
        <TabsTrigger value="reviews" className="relative">
          Reviews
          {reviewsCount > 0 && (
            <Badge variant="outline" className="ml-2 text-xs">
              {reviewsCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}
