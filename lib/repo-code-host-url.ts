/**
 * URL helpers for MCP registry repository links on github.com / gitlab.com (SaaS).
 * Parses GitHub owner/repo (+ optional tree/blob ref) and GitLab project path / refs for cron,
 * Markdown relative links, and GitLab API calls.
 */

export type GitHubComRepoUrlParts = {
  owner: string
  repo: string
  /** From `https://github.com/o/r/tree|blob/<ref>/...`; null for SSH or repo root HTTPS URLs */
  treeOrBlobRef: string | null
}

export type GitLabComLinkContext = { projectPath: string; ref: string }

export function parseGitHubComRepoUrl(urlString: string): GitHubComRepoUrlParts | null {
  try {
    const trimmed = urlString.trim()
    const httpsMatch = trimmed.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/]+))?(?:\/.*)?$/i,
    )
    if (httpsMatch?.[1] && httpsMatch[2]) {
      const rawRef = httpsMatch[3]
      let treeOrBlobRef: string | null = null
      if (rawRef) {
        try {
          treeOrBlobRef = decodeURIComponent(rawRef)
        } catch {
          treeOrBlobRef = rawRef
        }
      }
      return { owner: httpsMatch[1], repo: httpsMatch[2], treeOrBlobRef }
    }
    const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i)
    if (sshMatch?.[1] && sshMatch[2]) {
      return { owner: sshMatch[1], repo: sshMatch[2], treeOrBlobRef: null }
    }
    return null
  } catch (error) {
    console.error("Error parsing GitHub URL:", error)
    return null
  }
}

export function codeRepositoryHost(url: string): "github.com" | "gitlab.com" | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("git@")) {
    const colon = trimmed.indexOf(":")
    const at = trimmed.indexOf("@")
    if (at === -1 || colon <= at) return null
    const host = trimmed.slice(at + 1, colon).toLowerCase()
    if (host === "github.com") return "github.com"
    if (host === "gitlab.com") return "gitlab.com"
    return null
  }
  try {
    const withProto =
      trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("ssh://")
        ? trimmed
        : `https://${trimmed}`
    const u = new URL(withProto)
    const h = u.hostname.toLowerCase()
    if (h === "github.com") return "github.com"
    if (h === "gitlab.com") return "gitlab.com"
  } catch {
    return null
  }
  return null
}

export function parseGitLabComProjectPath(urlString: string): string | null {
  try {
    const trimmed = urlString.trim()
    if (trimmed.startsWith("git@")) {
      const m = trimmed.match(/^git@gitlab\.com:(.+?)(?:\.git)?$/i)
      if (!m?.[1]) return null
      const path = m[1].replace(/\.git$/i, "")
      if (path.includes("..") || path.startsWith("/") || !path.includes("/")) return null
      return path
    }
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const u = new URL(withProto)
    if (u.hostname !== "gitlab.com") return null
    let path = u.pathname.replace(/^\/+|\/+$/g, "")
    const marker = path.indexOf("/-/")
    if (marker !== -1) path = path.slice(0, marker)
    path = path.replace(/\.git$/i, "")
    if (!path || path.includes("..")) return null
    if (!path.includes("/")) return null
    return path
  } catch {
    return null
  }
}

/** Ref segment after `/-/blob/` or `/-/tree/`; supports `%2F` in branch/tag names via one encoded path segment. */
export function parseGitLabComRefFromUrl(urlString: string): string | null {
  try {
    const trimmed = urlString.trim()
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const u = new URL(withProto)
    if (u.hostname !== "gitlab.com") return null
    const m = u.pathname.match(/\/-\/(?:tree|blob)\/([^/]+)(?:\/|$)/)
    if (!m?.[1]) return null
    try {
      return decodeURIComponent(m[1])
    } catch {
      return m[1]
    }
  } catch {
    return null
  }
}

export function parseGitLabComLinkContext(repositoryUrl: string): GitLabComLinkContext | null {
  const projectPath = parseGitLabComProjectPath(repositoryUrl)
  if (!projectPath) return null
  const refFromUrl = parseGitLabComRefFromUrl(repositoryUrl)
  return { projectPath, ref: refFromUrl ?? "main" }
}
