import createMDX from "@next/mdx"
import { NextConfig } from "next"
import rehypeExternalLinks from "rehype-external-links"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import remarkSubSuper from "remark-supersub"

const ContentSecurityPolicy = `
  default-src 'none';
  base-uri 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  script-src 'self' ${process.env.NODE_ENV !== "production" ? "'unsafe-eval' " : ""} 'unsafe-inline' *.biocontext.ai biocontext.ai ${
    process.env.NODE_ENV !== "production" ? "localhost:* " : ""
  } *.cloudflareinsights.com;
  img-src 'self' data: *.biocontext.ai biocontext.ai ${
    process.env.NODE_ENV !== "production" ? "localhost:* " : ""
  } https://media.licdn.com https://github.com https://www.github.com https://www.github.com https://avatars.githubusercontent.com https://raw.githubusercontent.com https://img.shields.io https://codecov.io;
  style-src 'self' 'unsafe-inline' *.biocontext.ai biocontext.ai ${
    process.env.NODE_ENV !== "production" ? "localhost:* " : ""
  };
  media-src 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  font-src 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  form-action 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  frame-ancestors 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  frame-src 'self' *.biocontext.ai biocontext.ai tally.so ${
    process.env.NODE_ENV !== "production" ? "localhost:* " : ""
  };
  connect-src 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  manifest-src 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  worker-src 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  object-src 'self' *.biocontext.ai biocontext.ai ${process.env.NODE_ENV !== "production" ? "localhost:* " : ""};
  ${process.env.NODE_ENV === "production" && "upgrade-insecure-requests;"}
`

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "same-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  trailingSlash: false,
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "www.github.com",
      },
      {
        protocol: "https",
        hostname: "codecov.io",
      },
      {
        protocol: "https",
        hostname: "img.shields.io",
      },
    ],
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:path*{/}?",
        headers: [
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
        ],
      },
      {
        source: "/:all*(svg|jpg|png|ico|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=9999999999, must-revalidate",
          },
        ],
      },
    ]
  },
}

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [remarkBreaks, remarkSubSuper, [remarkGfm, { singleTilde: false }]],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        },
      ],
    ],
  },
})

export default withMDX(nextConfig)
