import "@/node_modules/rehype-github-alerts/dist/styling/css/index.css"
import { defaultSchema } from "hast-util-sanitize"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import rehypeExternalLinks from "rehype-external-links"
import { rehypeGithubAlerts } from "rehype-github-alerts"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import remarkSubSuper from "remark-supersub"
import { Pluggable, PluggableList } from "unified"
import CodeBlock from "./code-block"

interface MarkdownProps {
  children: string
  repositoryUrl?: string
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": (defaultSchema.attributes?.["*"] || []).filter((attr) => {
      const attrName = Array.isArray(attr) ? attr[0] : attr
      return attrName !== "className" && attrName !== "style"
    }),
  },
}

// Helper function to parse GitHub repository URL
function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  try {
    const patterns = [
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^\/]+))?(?:\/.*)?$/,
      /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return {
          owner: match[1],
          repo: match[2],
          branch: match[3] || "main", // Default to 'main' if no branch specified
        }
      }
    }
    return null
  } catch (error) {
    console.error("Error parsing GitHub URL:", error)
    return null
  }
}

// Helper function to clean up problematic HTML tags while preserving content
function cleanProblematicHtmlTags(content: string): string {
  // List of HTML tags that should be removed but their content preserved
  const problematicTags = ["body", "section"]

  let cleanedContent = content

  // Remove problematic tags but keep their content
  for (const tag of problematicTags) {
    // Match opening and closing tags (case insensitive, with optional attributes)
    // Also handle leading whitespace before tags
    const openTagRegex = new RegExp(`^\\s*<${tag}[^>]*>\\s*`, "gmi")
    const closeTagRegex = new RegExp(`\\s*</${tag}>\\s*$`, "gmi")

    // Remove opening tags with any leading whitespace
    cleanedContent = cleanedContent.replace(openTagRegex, "")
    // Remove closing tags with any trailing whitespace
    cleanedContent = cleanedContent.replace(closeTagRegex, "")
  }

  // Security: Clean up HTML comments to prevent injection attacks
  // Multiple passes handle various edge cases and malformed comment patterns
  // Note: rehype-sanitize provides additional protection, but defense in depth is critical

  // First pass: standard well-formed HTML comments
  cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, "")

  // Second pass: unclosed or malformed comments that could bypass sanitization
  cleanedContent = cleanedContent.replace(/<!--[\s\S]*$/g, "") // Unclosed comments at end
  cleanedContent = cleanedContent.replace(/^[\s\S]*?-->/g, "") // Comments without opening tag at start

  // Third pass: remove malformed comment-like patterns
  cleanedContent = cleanedContent.replace(/<--[^>]*>/g, "") // Single dash variants
  cleanedContent = cleanedContent.replace(/<!-[^>]*>/g, "") // Partial opening tags

  // Clean up excessive whitespace that might result from tag removal
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, "\n\n")

  // Don't remove leading whitespace indiscriminately as it breaks code block indentation
  // Only remove leading whitespace from lines that are clearly not part of code blocks
  // This is a more conservative approach that preserves code formatting

  return cleanedContent
}

// Helper function to convert relative links to GitHub URLs
function convertRelativeLinksToGitHub(content: string, repositoryUrl?: string): string {
  if (!repositoryUrl) {
    return content
  }

  const repoInfo = parseGitHubUrl(repositoryUrl)
  if (!repoInfo) {
    return content
  }

  const { owner, repo, branch } = repoInfo
  const baseUrl = `https://github.com/${owner}/${repo}`

  // Convert relative links in markdown format
  content = content.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("#")) {
      return match // Keep absolute URLs, mailto links, and anchors as-is
    }

    // Handle different types of relative links
    let convertedUrl = url

    // Remove leading ./ if present
    if (convertedUrl.startsWith("./")) {
      convertedUrl = convertedUrl.substring(2)
    }

    // Handle different file types and paths
    if (convertedUrl.includes(".")) {
      // Likely a file - determine if it should be blob or raw
      const fileExtension = convertedUrl.split(".").pop()?.toLowerCase()
      const isImageOrBinary = ["png", "jpg", "jpeg", "gif", "svg", "ico", "pdf", "zip", "tar", "gz"].includes(
        fileExtension || "",
      )

      if (isImageOrBinary) {
        // Use raw content for images and binary files
        convertedUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${convertedUrl}`
      } else {
        // Use blob for text files
        convertedUrl = `${baseUrl}/blob/${branch}/${convertedUrl}`
      }
    } else {
      // Likely a directory - use tree
      convertedUrl = `${baseUrl}/tree/${branch}/${convertedUrl}`
    }

    return `[${text}](${convertedUrl})`
  })

  // Convert relative links in HTML format
  content = content.replace(/<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, url, text) => {
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("#")) {
      return match // Keep absolute URLs, mailto links, and anchors as-is
    }

    // Handle different types of relative links
    let convertedUrl = url

    // Remove leading ./ if present
    if (convertedUrl.startsWith("./")) {
      convertedUrl = convertedUrl.substring(2)
    }

    // Handle different file types and paths
    if (convertedUrl.includes(".")) {
      // Likely a file - determine if it should be blob or raw
      const fileExtension = convertedUrl.split(".").pop()?.toLowerCase()
      const isImageOrBinary = ["png", "jpg", "jpeg", "gif", "svg", "ico", "pdf", "zip", "tar", "gz"].includes(
        fileExtension || "",
      )

      if (isImageOrBinary) {
        // Use raw content for images and binary files
        convertedUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${convertedUrl}`
      } else {
        // Use blob for text files
        convertedUrl = `${baseUrl}/blob/${branch}/${convertedUrl}`
      }
    } else {
      // Likely a directory - use tree
      convertedUrl = `${baseUrl}/tree/${branch}/${convertedUrl}`
    }

    // Preserve the original HTML attributes but update the href
    return match.replace(/href\s*=\s*["'][^"']+["']/, `href="${convertedUrl}"`)
  })

  // Convert relative image sources
  content = content.replace(/<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi, (match, src) => {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      return match // Keep absolute URLs and data URLs as-is
    }

    let convertedSrc = src

    // Remove leading ./ if present
    if (convertedSrc.startsWith("./")) {
      convertedSrc = convertedSrc.substring(2)
    }

    // Always use raw content for images
    convertedSrc = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${convertedSrc}`

    // Update the src attribute
    return match.replace(/src\s*=\s*["'][^"']+["']/, `src="${convertedSrc}"`)
  })

  return content
}

const Markdown = (props: MarkdownProps) => {
  // First, clean up problematic HTML tags
  let processedContent = cleanProblematicHtmlTags(props.children)

  // Then, convert relative links to GitHub URLs if repositoryUrl is provided
  if (props.repositoryUrl) {
    processedContent = convertRelativeLinksToGitHub(processedContent, props.repositoryUrl)
  }

  // Then apply other transformations
  const string = processedContent
    .replace(/__(.*?)__/g, '<ins className="underline">$1</ins>')
    .replace(/\\\[(.*?)\\\]/gs, (_, equation) => `$$${equation}$$`)
    .replace(/\\\((.*?)\\\)/gs, (_, equation) => `$${equation}$`)

  return (
    <>
      <ReactMarkdown
        components={{
          code: (props: any) => {
            const { node, inline, className, children, ...rest } = props

            // Check if it's inline code (multiple ways to detect)
            const isInline =
              inline || !className?.includes("language-") || (typeof children === "string" && !children.includes("\n"))

            // For inline code, just render as a simple code element
            if (isInline) {
              return (
                <code className={`px-1 py-0.5 rounded bg-muted text-sm font-mono ${className || ""}`} {...rest}>
                  {children}
                </code>
              )
            }

            // For code blocks, extract language and content
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : "text"
            const value = String(children).replace(/\n$/, "")

            return <CodeBlock value={value} language={language} className={className} />
          },
          img: ({ node, ...rest }) => {
            const substrings = rest.alt?.split("{{")
            const alt = substrings ? String(substrings[0]).trim() : rest.alt || "Image"

            // Don't resize markdown images - use original dimensions or reasonable defaults
            const widthMatch = substrings && substrings.length >= 2 && String(substrings[1]).match(/w:\s?(\d+)/)
            const heightMatch = substrings && substrings.length >= 2 && String(substrings[1]).match(/h:\s?(\d+)/)

            // Only use custom dimensions if explicitly specified in alt text
            const hasCustomDimensions = widthMatch || heightMatch
            const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined
            const height = heightMatch ? parseInt(heightMatch[1], 10) : undefined

            // Ensure src is always a string and handle empty/undefined cases
            const src = rest.src || ""

            if (hasCustomDimensions) {
              return (
                <Image
                  src={src}
                  alt={alt}
                  width={width || 640}
                  height={height || 400}
                  className="select-none object-contain"
                  unoptimized
                />
              )
            }

            // Use native img element like GitHub does for maximum compatibility
            return <img src={src} alt={alt} style={{ maxWidth: "100%" }} className="select-none max-h-[480px]" />
          },
          table: ({ node, ...rest }) => {
            return (
              <div className="overflow-x-scroll p-1">
                <table className="table-auto">{rest.children}</table>
              </div>
            )
          },
        }}
        remarkPlugins={[remarkSubSuper, [remarkGfm, { singleTilde: false }] as Pluggable]}
        rehypePlugins={
          [
            rehypeRaw,
            [rehypeSanitize, sanitizeSchema],
            [
              rehypeExternalLinks,
              {
                target: "_blank",
                rel: ["noopener", "noreferrer"],
              },
            ],
            rehypeGithubAlerts,
          ] as PluggableList
        }
        allowedElements={[
          "a",
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "img",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "ul",
          "ol",
          "li",
          "input",
          "blockquote",
          "code",
          "math",
          "pre",
          "em",
          "strong",
          "del",
          "ins",
          "hr",
          "br",
          "sup",
          "sub",
          "span",
          "div",
          "svg",
        ]}
      >
        {string}
      </ReactMarkdown>
    </>
  )
}

export default Markdown
