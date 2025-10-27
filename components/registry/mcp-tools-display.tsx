"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Wrench } from "lucide-react"

interface McpTool {
  id: string
  name: string
  description: string | null
  inputSchema: string | null
  lastChecked: Date
  createdAt: Date
  updatedAt: Date
  mcpServerId: string
}

interface McpToolsDisplayProps {
  tools: McpTool[]
  serverName: string
}

export function McpToolsDisplay({ tools, serverName }: McpToolsDisplayProps) {
  if (!tools || tools.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            MCP Tools
          </CardTitle>
          <CardDescription>No tools available for this MCP server.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const parseInputSchema = (schemaString: string | null) => {
    if (!schemaString) return null

    try {
      return JSON.parse(schemaString)
    } catch {
      return null
    }
  }

  const formatSchemaType = (schema: any): string => {
    if (!schema || typeof schema !== "object") return "unknown"

    if (schema.type) {
      return schema.type
    }

    if (schema.properties) {
      return "object"
    }

    return "unknown"
  }

  const getSchemaProperties = (
    schema: any,
  ): Array<{ name: string; type: string; description?: string; required?: boolean }> => {
    if (!schema || !schema.properties) return []

    const required = schema.required || []

    return Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
      name,
      type: prop.type || "unknown",
      description: prop.description,
      required: required.includes(name),
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          MCP Tools
          <Badge variant="secondary">{tools.length}</Badge>
        </CardTitle>
        <CardDescription>
          Available tools for {serverName}. Last updated {formatDate(tools[0]?.lastChecked || new Date())}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {tools.map((tool, index) => {
            const inputSchema = parseInputSchema(tool.inputSchema)
            const schemaProperties = getSchemaProperties(inputSchema)

            return (
              <AccordionItem key={tool.id} value={`tool-${index}`}>
                <AccordionTrigger className="hover:no-underline min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 text-left min-w-0 flex-1 overflow-hidden pr-4">
                    <Code className="h-4 w-4 text-muted-foreground hidden lg:block flex-shrink-0" />
                    <div className="font-medium min-w-0 flex-shrink-0 truncate">{tool.name}</div>
                    {tool.description && (
                      <div className="text-sm text-muted-foreground min-w-0 flex-1 truncate">
                        {tool.description.length > 60 ? `${tool.description.substring(0, 60)}...` : tool.description}
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {tool.description && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                    )}

                    {inputSchema && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Input Parameters</h4>
                        {schemaProperties.length > 0 ? (
                          <div className="space-y-2">
                            {schemaProperties.map((prop) => (
                              <div key={prop.name} className="border rounded-md p-3 bg-muted/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-mono bg-muted px-1 py-0.5 rounded">{prop.name}</code>
                                  <Badge variant="outline" className="text-xs">
                                    {prop.type}
                                  </Badge>
                                  {prop.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      required
                                    </Badge>
                                  )}
                                </div>
                                {prop.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{prop.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Schema type: <Badge variant="outline">{formatSchemaType(inputSchema)}</Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {!inputSchema && (
                      <div className="text-sm text-muted-foreground">No input schema available for this tool.</div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}
