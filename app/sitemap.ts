import { getBlogPosts } from "@/lib/blog"
import { getAllMCPServers } from "@/lib/registry"
import { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://biocontext.ai"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/registry`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  try {
    // Dynamic registry server routes
    const servers = await getAllMCPServers()
    const serverRoutes: MetadataRoute.Sitemap = servers
      .filter((server) => server.identifier) // Only include servers with identifiers
      .map((server) => ({
        url: `${baseUrl}/registry/${encodeURIComponent(server.identifier!)}`,
        lastModified: new Date(), // Use current date since updatedAt is not available in the type
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))

    // Dynamic blog post routes
    const blogPosts = await getBlogPosts(
      { published: true }, // filters
      { page: 1, limit: 1000 }, // pagination - get all published posts
    )

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    // Combine all routes
    return [...staticRoutes, ...serverRoutes, ...blogRoutes]
  } catch (error) {
    console.error("Error generating sitemap:", error)
    // Return static routes if dynamic generation fails
    return staticRoutes
  }
}
