import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://biocontext.ai"

  return {
    rules: [
      {
        userAgent: ["AhrefsBot", "Bingbot", "DuckDuckBot", "Googlebot"],
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/", "/_next/", "/private/"],
      },
      {
        userAgent: "*",
        disallow: "/",
      },
      // Block AI bots
      {
        userAgent: [
          "Amazonbot",
          "Applebot-Extended",
          "Bytespider",
          "CCBot",
          "ClaudeBot",
          "Google-Extended",
          "GPTBot",
          "meta-externalagent",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
