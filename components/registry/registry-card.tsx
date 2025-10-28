"use client"

import SaveToCollectionDialog from "@/components/collections/save-to-collection-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MCPServerWithReviewSummary } from "@/lib/registry"
import { Book, BookmarkIcon, Copy, ExternalLink, ThumbsUp, User, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import GitHub from "../icons/github"

interface RegistryCardProps {
  item: MCPServerWithReviewSummary
  children?: React.ReactNode
}

const getLicenseDisplayText = (license: string | undefined): string => {
  if (!license) return "Unknown"

  // If license is a string (URI), return it as-is
  if (typeof license === "string") {
    license = license.split("/").pop()?.replace(".html", "") || license
    return license
  }

  return "Unknown"
}

export default function RegistryCard({ item, children }: RegistryCardProps) {
  const licenseText = getLicenseDisplayText(item.license)

  return (
    <TooltipProvider>
      <Card
        className="h-full flex flex-col hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border group relative"
        itemScope
        itemType="https://schema.org/SoftwareApplication"
        itemID={item["@id"]}
      >
        {/* Installation Available Indicator - Floating Badge */}
        {item.installationConfig ||
          (item.url && (
            <div className="absolute -top-3 -right-3 z-10 flex gap-1">
              {item.url && (
                <Badge
                  variant="default"
                  className="text-xs bg-blue-400 hover:bg-blue-500 text-white border-2 border-white dark:border-gray-950 shadow-md"
                >
                  Remote server
                </Badge>
              )}
              {item.installationConfig && (
                <Badge
                  variant="default"
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white border-2 border-white dark:border-gray-950 shadow-md"
                >
                  mcp.json available
                </Badge>
              )}
            </div>
          ))}

        {/* Additional types for enhanced semantic markup */}
        {item.additionalType?.map((type, index) => <link key={index} itemProp="additionalType" href={type} />) || (
          <>
            <link itemProp="additionalType" href="https://schema.org/SoftwareSourceCode" />
            <link itemProp="additionalType" href="https://schema.org/ScholarlyArticle" />
          </>
        )}

        {item.identifier && <meta itemProp="identifier" content={item.identifier} />}

        {/* Application category */}
        {item.applicationCategory && <meta itemProp="applicationCategory" content={item.applicationCategory} />}

        {/* Date published */}
        {item.datePublished && <meta itemProp="datePublished" content={item.datePublished} />}

        {/* Operating systems */}
        {item.operatingSystem?.map((os, index) => (
          <meta key={index} itemProp="operatingSystem" content={os} />
        ))}

        {/* Features */}
        {item.featureList?.map((feature, index) => (
          <meta key={index} itemProp="featureList" content={feature} />
        ))}

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <CardTitle
              className="text-xl font-bold tracking-tight line-clamp-2 group-hover:text-primary transition-colors flex-1 min-w-0"
              title={item.name}
              itemProp="name"
            >
              <Link
                href={`/registry/${encodeURIComponent(item.identifier || item["@id"] || "").replaceAll("%2F", "/")}`}
                className="block overflow-hidden truncate"
              >
                {item.name}
              </Link>
            </CardTitle>

            <div className="flex items-center gap-2 shrink-0">
              {/* GitHub Stars Badge */}
              {item.githubStars !== undefined && item.githubStars > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800/50 cursor-help">
                      <GitHub className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.githubStars.toLocaleString()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>GitHub Stars</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Vote Score Badge */}
              {item.aggregateRating.totalReviews > 0 && (
                <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-md border border-green-200 dark:border-green-800/50">
                  <ThumbsUp className="h-3 w-3 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {item.aggregateRating.netVotes}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <CardDescription className="pt-3 leading-relaxed text-muted-foreground line-clamp-3" itemProp="description">
            {item.description}
          </CardDescription>

          {/* Maintainers Section */}
          <div className="space-y-2 mt-3 pb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Maintainer(s)</span>

            <div className="flex flex-wrap gap-2">
              {item.maintainer?.map((maintainer, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Link href={maintainer.url ?? "#"}>
                      <div
                        itemProp="maintainer"
                        itemScope
                        itemType={`https://schema.org/${maintainer["@type"]}`}
                        style={{ display: "none" }}
                      >
                        <meta itemProp="name" content={maintainer.name} />
                        {maintainer.identifier && <meta itemProp="identifier" content={maintainer.identifier} />}
                        {maintainer.url && <meta itemProp="url" content={maintainer.url} />}
                      </div>

                      {maintainer.url && maintainer.url.includes("github.com/") ? (
                        (() => {
                          const parts = maintainer.url.split("github.com/")
                          const username = parts[1]?.split("/")[0]
                          if (username) {
                            return (
                              <Image
                                src={`https://github.com/${username}.png?size=40`}
                                alt={`${maintainer.name}'s GitHub avatar`}
                                className="size-6 rounded-full"
                                width={24}
                                height={24}
                                unoptimized
                                itemProp="image"
                              />
                            )
                          }
                          // Fallback if username extraction fails
                          return maintainer["@type"] === "Person" ? (
                            <User className="size-6 text-muted-foreground" />
                          ) : (
                            <Users className="size-6 text-muted-foreground" />
                          )
                        })()
                      ) : maintainer["@type"] === "Person" ? (
                        <User className="size-6 text-muted-foreground" />
                      ) : (
                        <Users className="size-6 text-muted-foreground" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{maintainer.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            {/* License and Programming Languages */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                License & Tech Stack
              </span>
              <div className="flex flex-wrap gap-1">
                {item.license !== "Unknown" && item.license && <meta itemProp="license" content={item.license} />}
                {/* License */}
                {item.license && (
                  <Badge
                    variant={licenseText !== "Unknown" ? "default" : "secondary"}
                    className={`text-xs ${
                      licenseText !== "Unknown"
                        ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-900/40"
                        : ""
                    }`}
                    itemProp="license"
                  >
                    {licenseText}
                  </Badge>
                )}

                {/* Programming Languages */}
                {item.programmingLanguage?.slice(0, 3).map((lang, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                    itemProp="programmingLanguage"
                  >
                    {lang}
                  </Badge>
                ))}
                {item.programmingLanguage && item.programmingLanguage.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.programmingLanguage.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Keywords */}
            {item.keywords && item.keywords.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {item.keywords.slice(0, 4).map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/40"
                      itemProp="keywords"
                    >
                      {keyword}
                    </Badge>
                  ))}
                  {item.keywords.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.keywords.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Keywords */}
            {item.featureList && item.featureList.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features</span>
                <div className="flex flex-wrap gap-1">
                  {item.featureList.slice(0, 4).map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/40"
                      itemProp="featureList"
                    >
                      {keyword}
                    </Badge>
                  ))}
                  {item.featureList.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.featureList.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {item.url && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Remote MCP server
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer"
                    itemProp="url"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url || "")
                      toast.success("Installation URL copied to clipboard", {
                        description: "You can now paste it into your MCP client.",
                      })
                    }}
                  >
                    <span>
                      <span className="truncate">{item.url}</span>
                      <Copy className="inline-block h-4 w-4 ml-1 cursor-pointer opacity-50 hover:opacity-100" />
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-end pt-0">
          {children}

          <Separator className="my-4" />

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <Button asChild variant="default" size="sm" className="w-full group/btn">
                  <Link
                    href={`/registry/${encodeURIComponent(item.identifier || item["@id"] || "").replaceAll(
                      "%2F",
                      "/",
                    )}`}
                  >
                    <Book className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
              <SaveToCollectionDialog mcpServerId={item.identifier || item["@id"] || ""} serverName={item.name}>
                <Button variant="outline" size="sm" className="w-full">
                  <BookmarkIcon className="h-4 w-4" />
                </Button>
              </SaveToCollectionDialog>
            </div>

            {/* Dynamic layout based on available links */}
            {(item.codeRepository || item.softwareHelp?.url) && (
              <div
                className={`grid gap-2 ${item.codeRepository && item.softwareHelp?.url ? "grid-cols-2" : "grid-cols-1"}`}
              >
                {item.codeRepository && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={item.codeRepository} target="_blank" rel="noopener noreferrer" itemProp="codeRepository">
                      <GitHub className="h-4 w-4 mr-1" />
                      Code
                      <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                    </a>
                  </Button>
                )}
                {item.softwareHelp?.url && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={item.softwareHelp.url} target="_blank" rel="noopener noreferrer" itemProp="softwareHelp">
                      <Book className="h-4 w-4 mr-1" />
                      <span className="truncate">{item.softwareHelp.name || "Docs"}</span>
                      <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
