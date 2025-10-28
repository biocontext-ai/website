import SearchableRegistryList from "@/components/registry/searchable-registry-list"
import { getPaginatedMCPServers } from "@/lib/registry"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MCP Server Registry | BioContextAI",
  description:
    "Comprehensive registry of biomedical Model Context Protocol servers for AI-powered healthcare and research applications",
  keywords: ["MCP", "Model Context Protocol", "biomedical", "healthcare", "AI", "research"],
  openGraph: {
    title: "MCP Server Registry | BioContextAI",
    description: "Discover and integrate Model Context Protocol servers for biomedical applications",
    type: "website",
  },
}

interface RegistryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RegistryPage({ searchParams }: RegistryPageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = typeof params.search === "string" ? params.search : ""
  const sortBy = (typeof params.sort === "string" ? params.sort : "recommended") as
    | "recommended"
    | "alphabetical"
    | "rating-desc"
    | "stars-desc"
    | "date-newest"
    | "date-oldest"
  const hasInstallation = params.hasInstallation === "true"
  const isRemote = params.isRemote === "true"

  const paginatedData = await getPaginatedMCPServers({
    page: currentPage,
    limit: 18,
    search: searchQuery,
    sortBy,
    hasInstallation,
    isRemote,
  })

  return (
    <div className="container mx-auto px-4 py-8" itemScope itemType="https://schema.org/WebPage">
      <meta itemProp="name" content="BioContextAI Registry" />
      <meta
        itemProp="description"
        content="Comprehensive registry of biomedical Model Context Protocol servers for AI-powered healthcare and research applications"
      />
      <link itemProp="url" href="https://biocontext.ai/registry" />

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight" itemProp="headline">
              <span className="text-foreground">Registry</span>
            </h1>
            <p className="text-lg text-center text-muted-foreground text-balance max-w-lg mx-auto">
              Discover biomedical Model Context Protocol servers for your agentic AI applications
            </p>
          </div>
        </div>

        <div itemScope itemType="https://schema.org/ItemList" itemProp="mainEntity">
          <meta itemProp="numberOfItems" content={paginatedData.totalCount.toString()} />
          <meta itemProp="name" content="BioContextAI MCP Server Registry" />
          <SearchableRegistryList
            servers={paginatedData.servers}
            totalCount={paginatedData.totalCount}
            totalPages={paginatedData.totalPages}
            currentPage={paginatedData.currentPage}
          />
        </div>
      </div>
    </div>
  )
}
