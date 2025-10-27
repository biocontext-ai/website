"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function BlogSearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      const url = new URL(window.location.href)
      if (search) {
        url.searchParams.set("search", search)
      } else {
        url.searchParams.delete("search")
      }
      url.searchParams.delete("page") // Reset to page 1 when searching
      router.push(url.toString())
    }, 500) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [search, router])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search blog posts..."
        className="pl-10"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  )
}
