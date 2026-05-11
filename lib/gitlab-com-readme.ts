import { parseGitLabComProjectPath } from "@/lib/gitlab-com-url"

const GITLAB_API = "https://gitlab.com/api/v4"

const README_CANDIDATES = ["README.md", "README.rst", "README", "readme.md"]

export type GitLabComReadmeResult = {
  content: string
  encoding: string
  sha: string
  size: number
}

function gitLabHeaders(token?: string): HeadersInit {
  const h: HeadersInit = { Accept: "application/json" }
  if (token) h["PRIVATE-TOKEN"] = token
  return h
}

type ProjectResponse = { default_branch: string }

type FileResponse = {
  content: string
  encoding: string
  blob_id: string
  size: number
}

export async function fetchGitLabComReadme(
  repositoryUrl: string,
  token?: string,
): Promise<GitLabComReadmeResult | null> {
  const projectPath = parseGitLabComProjectPath(repositoryUrl)
  if (!projectPath) return null

  const id = encodeURIComponent(projectPath)
  const headers = gitLabHeaders(token)
  const metaRes = await fetch(`${GITLAB_API}/projects/${id}`, { headers, next: { revalidate: 0 } })
  if (!metaRes.ok) return null
  const meta = (await metaRes.json()) as ProjectResponse
  const ref = meta.default_branch || "main"

  for (const filePath of README_CANDIDATES) {
    const fp = encodeURIComponent(filePath)
    const fileRes = await fetch(`${GITLAB_API}/projects/${id}/repository/files/${fp}?ref=${encodeURIComponent(ref)}`, {
      headers,
      next: { revalidate: 0 },
    })
    if (!fileRes.ok) continue
    const file = (await fileRes.json()) as FileResponse
    if (!file.content || file.encoding !== "base64") continue
    return {
      content: file.content,
      encoding: "base64",
      sha: file.blob_id,
      size: file.size,
    }
  }

  return null
}
