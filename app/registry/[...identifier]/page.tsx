import { auth } from "@/auth"
import SaveToCollectionDialog from "@/components/collections/save-to-collection-dialog"
import ServerCollections from "@/components/collections/server-collections"
import { AggregateRatingDisplay } from "@/components/registry/aggregate-rating-display"
import DeleteMcpServerButton from "@/components/registry/delete-mcp-server-button"
import { GitHubReadmeDisplay } from "@/components/registry/github-readme-display"
import ImportToChatButton from "@/components/registry/import-to-chat-button"
import { InstallationDisplay } from "@/components/registry/installation-display"
import { McpToolsDisplay } from "@/components/registry/mcp-tools-display"
import ReviewForm from "@/components/registry/review-form"
import ReviewsList from "@/components/registry/reviews-list"
import { ServerTabs } from "@/components/registry/server-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { isUserAdmin } from "@/lib/auth"
import { getMCPServerWithReviews, hasUserReviewed } from "@/lib/registry"
import {
  BookmarkIcon,
  CalendarDays,
  Code,
  Coins,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Star,
  Tag,
  User,
  Users,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import GitHub from "@/components/icons/github"
import ReportButton from "@/components/registry/report-button"

interface ServerDetailPageProps {
  params: Promise<{
    identifier: string[]
  }>
}

const getLicenseDisplayText = (license?: string) => {
  if (!license) return "Unknown"
  if (license.includes("Unknown")) return "Unknown"
  if (typeof license === "string") return license
  return "Unknown"
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "Unknown"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

type Props = {
  params: Promise<{ identifier: string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const urlParams = await params
  const identifier = urlParams.identifier.join("/")
  const result = await getMCPServerWithReviews(identifier)

  if (!result) {
    return {
      title: "Server Not Found | BioContextAI Registry",
      description: "The requested MCP server could not be found in the registry.",
    }
  }

  const { server } = result

  return {
    title: `${server.name} | BioContextAI Registry`,
    description: server.description,
    keywords: server.keywords,
    openGraph: {
      title: server.name,
      description: server.description,
      type: "website",
    },
  }
}

export default async function ServerDetailPage({ params }: ServerDetailPageProps) {
  const urlParams = await params
  const identifier = urlParams.identifier.join("/")
  const result = await getMCPServerWithReviews(identifier)

  if (!result) {
    notFound()
  }

  const session = await auth()

  const { server, serverId, reviews, aggregateRating, githubStars, githubReadme, mcpTools } = result
  const licenseText = getLicenseDisplayText(server.license)
  const installationConfig = server.installationConfig
  const userReview = session?.user?.id ? await hasUserReviewed(session.user.id, serverId) : null

  // Check if current user is admin
  const isAdmin = session?.user?.id ? await isUserAdmin(session.user.id) : false

  return (
    <TooltipProvider>
      <div
        className="container mx-auto px-4 py-8"
        itemScope
        itemType="https://schema.org/SoftwareApplication"
        itemID={server["@id"] || ""}
      >
        {server.identifier && <meta itemProp="identifier" content={server.identifier} />}
        {server.applicationCategory && <meta itemProp="applicationCategory" content={server.applicationCategory} />}
        {server.datePublished && <meta itemProp="datePublished" content={server.datePublished} />}

        {/* Additional types */}
        {server.additionalType?.map((type, index) => <link key={index} itemProp="additionalType" href={type} />) || (
          <>
            <link itemProp="additionalType" href="https://schema.org/SoftwareSourceCode" />
          </>
        )}

        {/* Operating systems */}
        {server.operatingSystem?.map((os, index) => <meta key={index} itemProp="operatingSystem" content={os} />)}

        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight" itemProp="name">
                  {server.name}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <SaveToCollectionDialog mcpServerId={server.identifier || server["@id"] || ""} serverName={server.name}>
                  <Button variant="outline">
                    <BookmarkIcon className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </SaveToCollectionDialog>

                {githubStars !== undefined && githubStars > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800/50 cursor-help">
                        <GitHub className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {githubStars.toLocaleString()} stars
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>GitHub Stars</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {server.softwareHelp?.url && (
                  <Button asChild variant="outline">
                    <a href={server.softwareHelp.url} target="_blank" rel="noopener noreferrer" itemProp="softwareHelp">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      <span className="truncate">
                      {server.softwareHelp.name || "Documentation"}
                      </span>
                    </a>
                  </Button>
                )}

                {server.codeRepository && (
                  <Button asChild>
                    <a href={server.codeRepository} target="_blank" rel="noopener noreferrer" itemProp="codeRepository">
                      <GitBranch className="w-4 h-4 mr-2" />
                      Repository
                    </a>
                  </Button>
                )}

                {/* Admin-only delete button */}
                {isAdmin && (
                  <DeleteMcpServerButton
                    serverIdentifier={server.identifier || server["@id"] || ""}
                    serverName={server.name}
                  />
                )}
              </div>
            </div>

            {/* Keywords */}
            {server.keywords && server.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {server.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" itemProp="keywords">
                    <Tag className="w-3 h-3 mr-1" />
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Description
                    </h4>
                    <p className="leading-relaxed" itemProp="description">
                      {server.description}
                    </p>
                  </div>

                  {server.featureList && server.featureList.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Features
                        </h4>
                        <ul className="space-y-2">
                          {server.featureList.map((feature, index) => (
                            <li key={index} className="flex items-start" itemProp="featureList">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Installation Section - Outside of tabs */}
              {installationConfig && (
                <InstallationDisplay
                  installationConfig={installationConfig}
                  serverName={server.name}
                  identifier={server.identifier || server["@id"] || ""}
                />
              )}

              {/* Tabbed Content - README, Tools, and Reviews */}
              <ServerTabs
                hasTools={!!(mcpTools && mcpTools.length > 0)}
                toolsCount={mcpTools?.length}
                reviewsCount={reviews.length}
              >
                <TabsContent value="readme" className="mt-6">
                  {server.codeRepository && (
                    <GitHubReadmeDisplay readmeData={githubReadme} repositoryUrl={server.codeRepository} />
                  )}
                  {!server.codeRepository && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          README
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">No README available for this MCP server.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {mcpTools && mcpTools.length > 0 && (
                  <TabsContent value="tools" className="mt-6">
                    <McpToolsDisplay tools={mcpTools} serverName={server.name} />
                  </TabsContent>
                )}

                <TabsContent value="reviews" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5" />
                          <span>Reviews ({reviews.length})</span>
                        </div>
                        <AggregateRatingDisplay aggregateRating={aggregateRating} serverName={server.name} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Review Form or Login Prompt */}
                      {session?.user ? (
                        userReview ? (
                          <div className="border rounded-lg p-6">
                            <ReviewForm mcpServerId={serverId} serverName={server.name} existingReview={userReview} />
                          </div>
                        ) : (
                          <div className="border rounded-lg p-6">
                            <ReviewForm mcpServerId={serverId} serverName={server.name} />
                          </div>
                        )
                      ) : (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-3">
                            Please sign in to write a review for this MCP server.
                          </p>
                          <Button size="sm" asChild>
                            <Link href="/signin">Sign In</Link>
                          </Button>
                        </div>
                      )}

                      {/* Reviews List */}
                      {reviews.length > 0 && (
                        <>
                          <Separator />
                          <ReviewsList reviews={reviews} currentUserId={session?.user?.id} />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </ServerTabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info & Technical Details Combined */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Server Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Identifier */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Identifier
                    </h4>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{server.identifier}</code>
                  </div>

                  {/* Date Published */}
                  {server.datePublished && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Published
                      </h4>
                      <p className="text-sm">{formatDate(server.datePublished)}</p>
                    </div>
                  )}

                  {server.url && (
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Remote MCP Server
                        </h4>
                        <a
                          href={server.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                          itemProp="url"
                        >
                          {server.url}
                        </a>
                      </div>
                      <ImportToChatButton serverName={server.name} serverUrl={server.url} />
                    </div>
                  )}

                  {/* GitHub Stars */}
                  {githubStars !== undefined && githubStars > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center">
                        <GitHub className="w-4 h-4 mr-2" />
                        GitHub Stars
                      </h4>
                      <p className="text-sm font-medium">{githubStars.toLocaleString()}</p>
                    </div>
                  )}

                  {/* Token Count */}
                  {server.tokenCount !== undefined && server.tokenCount !== null && server.tokenCount > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center">
                        <Coins className="w-4 h-4 mr-2" />
                        Estimated Context Usage
                      </h4>
                      <p className="text-sm font-medium">{server.tokenCount.toLocaleString()} tokens</p>
                    </div>
                  )}

                  {reviews.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Reviews
                      </h4>
                      <AggregateRatingDisplay aggregateRating={aggregateRating} serverName={server.name} />
                    </div>
                  )}

                  {/* Separator before technical details */}
                  {(server.programmingLanguage?.length || server.operatingSystem?.length || server.license || server.applicationCategory) && (
                    <Separator />
                  )}

                  {/* Programming Languages */}
                  {server.programmingLanguage && server.programmingLanguage.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center">
                        <Code className="w-4 h-4 mr-2" />
                        Programming Languages
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {server.programmingLanguage.map((lang) => (
                          <Badge key={lang} variant="outline" itemProp="programmingLanguage">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operating Systems */}
                  {server.operatingSystem && server.operatingSystem.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Operating Systems
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {server.operatingSystem.map((os) => (
                          <Badge key={os} variant="outline" itemProp="operatingSystem">
                            {os}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* License */}
                  {server.license && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        License
                      </h4>
                      {!licenseText.includes("Unknown") && (
                        <meta itemProp="identifier" content={server.license} />
                      )}
                      <Badge variant={!licenseText.includes("Unknown") ? "default" : "secondary"}>{licenseText}</Badge>
                    </div>
                  )}

                  {/* Application Category - hidden but kept for SEO */}
                  {server.applicationCategory && (
                    <meta itemProp="applicationCategory" content={server.applicationCategory} />
                  )}

                  {/* Links */}
                  {(server.codeRepository || server.softwareHelp?.url) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Links</h4>
                        {server.codeRepository && (
                          <a
                            href={server.codeRepository}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary hover:underline"
                          >
                            <GitBranch className="w-4 h-4 mr-2" />
                            Source Code
                          </a>
                        )}
                        {server.softwareHelp?.url && (
                          <a
                            href={server.softwareHelp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary hover:underline"
                            itemProp="softwareHelp"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {server.softwareHelp.name || "Documentation"}
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Maintainers */}
              {server.maintainer && server.maintainer.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Maintainers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-y-2">
                    {server.maintainer.map((maintainer, index) => (
                      <Card
                        key={index}
                        className="flex items-center py-2 px-4 gap-x-3"
                        itemProp="maintainer"
                        itemScope
                        itemType={`https://schema.org/${maintainer["@type"]}`}
                      >
                        <meta itemProp="name" content={maintainer.name} />
                        {maintainer.identifier && <meta itemProp="identifier" content={maintainer.identifier} />}
                        {maintainer.url && <meta itemProp="url" content={maintainer.url} />}

                        <div className="flex-shrink-0">
                          {maintainer.url && maintainer.url.startsWith("https://github.com/") ? (
                            (() => {
                              const parts = maintainer.url.split("github.com/")
                              const username = parts[1]?.split("/")[0]
                              if (username) {
                                return (
                                  <Image
                                    src={`https://github.com/${username}.png?size=40`}
                                    alt={`${maintainer.name}'s GitHub avatar`}
                                    className="size-10 rounded-full"
                                    width={40}
                                    height={40}
                                    unoptimized
                                    itemProp="image"
                                  />
                                )
                              }
                              // Fallback if username extraction fails
                              return maintainer["@type"] === "Person" ? (
                                <User className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <Users className="w-5 h-5 text-muted-foreground" />
                              )
                            })()
                          ) : maintainer["@type"] === "Person" ? (
                            <User className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Users className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            {maintainer.url ? (
                              <Link
                                href={maintainer.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {maintainer.name}
                              </Link>
                            ) : (
                              maintainer.name
                            )}
                          </div>
                          {maintainer.identifier && (
                            <div className="text-xs text-muted-foreground">@{maintainer.identifier}</div>
                          )}
                          <div className="text-xs text-muted-foreground">{maintainer["@type"]}</div>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Report Server */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Issue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Report this server if it violates guidelines or has issues.
                  </p>
                  <ReportButton identifier={identifier} />
                </CardContent>
              </Card>

              {/* Collections */}
              <ServerCollections serverId={server.identifier || server["@id"] || ""} serverName={server.name} />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
