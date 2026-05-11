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

export function parseGitLabComRefFromUrl(urlString: string): string | null {
  const m = urlString.match(/\/-\/(?:tree|blob)\/([^/]+)\//)
  return m?.[1] ?? null
}

export type GitLabComLinkContext = { projectPath: string; ref: string }

export function parseGitLabComLinkContext(repositoryUrl: string): GitLabComLinkContext | null {
  const projectPath = parseGitLabComProjectPath(repositoryUrl)
  if (!projectPath) return null
  const refFromUrl = parseGitLabComRefFromUrl(repositoryUrl)
  return { projectPath, ref: refFromUrl ?? "main" }
}
