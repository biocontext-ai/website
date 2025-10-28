"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MCPServerWithReviewSummary } from "@/lib/registry"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Button } from "../ui/button"
import FilterPills from "./filter-pills"
import RegistryList from "./registry-list"
import RegistrySkeleton from "./registry-skeleton"
import SearchInput from "./search-input"

type SortOption = "recommended" | "alphabetical" | "rating-desc" | "stars-desc" | "date-newest" | "date-oldest"

interface SearchableRegistryListProps {
  servers: MCPServerWithReviewSummary[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function SearchableRegistryList({
  servers,
  totalCount,
  totalPages,
  currentPage,
}: SearchableRegistryListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "recommended")
  const [hasInstallation, setHasInstallation] = useState(searchParams.get("hasInstallation") === "true")
  const [isRemote, setIsRemote] = useState(searchParams.get("isRemote") === "true")
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [isDebouncing, setIsDebouncing] = useState(false)

  // Update URL when search, sort, filters, or page changes
  const updateURL = (updates: {
    search?: string
    sort?: string
    page?: number
    hasInstallation?: boolean
    isRemote?: boolean
  }) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    if (updates.search !== undefined) {
      if (updates.search) {
        newSearchParams.set("search", updates.search)
      } else {
        newSearchParams.delete("search")
      }
      // Reset to page 1 when search changes
      newSearchParams.delete("page")
    }

    if (updates.sort !== undefined) {
      if (updates.sort !== "recommended") {
        newSearchParams.set("sort", updates.sort)
      } else {
        newSearchParams.delete("sort")
      }
      // Reset to page 1 when sort changes
      newSearchParams.delete("page")
    }

    if (updates.page !== undefined) {
      if (updates.page > 1) {
        newSearchParams.set("page", updates.page.toString())
      } else {
        newSearchParams.delete("page")
      }
    }

    if (updates.hasInstallation !== undefined) {
      if (updates.hasInstallation) {
        newSearchParams.set("hasInstallation", "true")
      } else {
        newSearchParams.delete("hasInstallation")
      }
      // Reset to page 1 when filter changes
      newSearchParams.delete("page")
    }

    if (updates.isRemote !== undefined) {
      if (updates.isRemote) {
        newSearchParams.set("isRemote", "true")
      } else {
        newSearchParams.delete("isRemote")
      }
      // Reset to page 1 when filter changes
      newSearchParams.delete("page")
    }

    const newURL = `/registry${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`
    startTransition(() => {
      router.push(newURL, { scroll: false })
    })
  }

  // Skip initial mount for debounce
  useEffect(() => {
    setIsInitialMount(false)
  }, [])

  // Handle search input changes with debounce
  useEffect(() => {
    if (isInitialMount) return

    // Show loading state immediately when search query changes
    setIsDebouncing(true)

    const timeoutId = setTimeout(() => {
      setIsDebouncing(false)
      updateURL({ search: searchQuery })
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      setIsDebouncing(false)
    }
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle sort changes
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    updateURL({ sort: newSort })
  }

  // Handle page changes
  const handlePageChange = (page: number) => {
    updateURL({ page })
  }

  // Handle filter changes
  const handleToggleInstallation = () => {
    const newValue = !hasInstallation
    setHasInstallation(newValue)
    updateURL({ hasInstallation: newValue })
  }

  const handleToggleRemote = () => {
    const newValue = !isRemote
    setIsRemote(newValue)
    updateURL({ isRemote: newValue })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <div className="flex-1">
            <SearchInput value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="sm:w-48">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="rating-desc">Most Helpful</SelectItem>
                <SelectItem value="stars-desc">Most GitHub Stars</SelectItem>
                <SelectItem value="date-newest">Newest</SelectItem>
                <SelectItem value="date-oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <FilterPills
          hasInstallation={hasInstallation}
          isRemote={isRemote}
          onToggleInstallation={handleToggleInstallation}
          onToggleRemote={handleToggleRemote}
        />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2">
          <div className="flex justify-between lg:justify-start items-center gap-y-2 gap-x-4">
            <h2 className="text-2xl font-bold tracking-tight">MCP Servers</h2>
            <Button asChild className="gap-2">
              <Link href="/registry/editor">
                <PlusCircle className="w-5 h-5" />
                <span>Add Your Server</span>
              </Link>
            </Button>
          </div>
          <span className="text-muted-foreground">
            {totalCount} server
            {totalCount !== 1 ? "s" : ""} found
            {totalPages > 1 && (
              <span className="ml-2">
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </span>
        </div>

        {isPending || isDebouncing ? (
          <RegistrySkeleton count={20} />
        ) : servers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? `No servers found matching "${searchQuery}"` : "No servers available"}
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search terms or clear the search to see all servers.
              </p>
            )}
          </div>
        ) : (
          <>
            <RegistryList items={servers} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {currentPage > 4 && <PaginationEllipsis />}
                      </>
                    )}

                    {/* Pages around current */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      if (pageNumber > totalPages) return null

                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={pageNumber === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <PaginationEllipsis />}
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
