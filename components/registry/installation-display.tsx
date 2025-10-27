"use client"

import CodeBlock from "@/components/code-block"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ExternalLink, ShieldAlert } from "lucide-react"
import Link from "next/link"

interface InstallationDisplayProps {
  installationConfig: any
  serverName: string
  identifier: string
}

export function InstallationDisplay({ installationConfig, serverName, identifier }: InstallationDisplayProps) {
  if (!installationConfig) {
    return null
  }

  // Determine the type of installation (url, command with npx, or command with uvx)
  const hasUrl = !!installationConfig.url
  const hasCommand = !!installationConfig.command
  const isNpx = hasCommand && installationConfig.command === "npx"
  const isUvx = hasCommand && installationConfig.command === "uvx"
  const args = installationConfig.args || []
  const serverKey = identifier.split("/").pop() || "server"

  // Generate installation commands for different tools
  const generateClaudeCommand = () => {
    if (hasUrl) {
      return `claude mcp add --scope user --transport http ${serverKey} ${installationConfig.url}`
    } else if (isNpx) {
      const argsStr = args.join(" ")
      return `claude mcp add ${serverKey} -s user -- npx ${argsStr}`
    } else if (isUvx) {
      const argsStr = args.join(" ")
      return `claude mcp add ${serverKey} -s user -- uvx ${argsStr}`
    }
    return null
  }

  const generateGeminiCommand = () => {
    if (hasUrl) {
      return `gemini mcp add --transport http ${serverKey} ${installationConfig.url}`
    } else if (isNpx) {
      // For npx: command is "npx", args follow
      return `gemini mcp add ${serverKey} npx ${args.join(" ")}`
    } else if (isUvx) {
      // For uvx: command is "uvx", args follow
      return `gemini mcp add ${serverKey} uvx ${args.join(" ")}`
    }
    return null
  }

  const generateCodexCommand = () => {
    if (hasUrl) {
      return `codex mcp add -- ${serverKey} npx -y mcp-remote@latest ${installationConfig.url}`
    } else if (isNpx) {
      const argsStr = args.join(" ")
      return `codex mcp add -- ${serverKey} npx ${argsStr}`
    } else if (isUvx) {
      const argsStr = args.join(" ")
      return `codex mcp add -- ${serverKey} uvx ${argsStr}`
    }
    return null
  }

  const generateCursorConfig = () => {
    if (hasUrl) {
      return {
        type: "http",
        url: installationConfig.url,
      }
    } else if (hasCommand) {
      return {
        type: "stdio",
        command: installationConfig.command,
        args: args,
      }
    }
    return null
  }

  const generateCursorInstallLink = () => {
    const config = generateCursorConfig()
    if (!config) return null

    const configString = JSON.stringify(config)
    const base64Config = Buffer.from(configString).toString("base64")
    return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(serverKey)}&config=${base64Config}`
  }

  const generateVSCodeConfig = () => {
    if (hasUrl) {
      return {
        servers: {
          [serverKey]: {
            type: "http",
            url: installationConfig.url,
          },
        },
      }
    } else if (hasCommand) {
      return {
        servers: {
          [serverKey]: {
            type: "stdio",
            command: installationConfig.command,
            args: args,
          },
        },
      }
    }
    return null
  }

  const claudeCommand = generateClaudeCommand()
  const geminiCommand = generateGeminiCommand()
  const codexCommand = generateCodexCommand()
  const cursorConfig = generateCursorConfig()
  const cursorInstallLink = generateCursorInstallLink()
  const vscodeConfig = generateVSCodeConfig()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Installation</CardTitle>
            <CardDescription>Choose your AI assistant to see installation instructions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasUrl ? "default" : "secondary"}>{hasUrl ? "Streamable HTTP" : "stdio"}</Badge>
            {isNpx && <Badge variant="outline">NPM</Badge>}
            {isUvx && <Badge variant="outline">Python</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Security Notice:</strong> Third-party MCP servers can access your system resources and execute
            commands. Review the server&apos;s source code and only install servers from trusted sources. Check the
            repository, maintainer reputation, and required permissions before installation.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="mcp-json" className="w-full">
          <div className="overflow-x-auto rounded-md">
            <TabsList className="grid grid-cols-6 w-max min-w-full">
              <TabsTrigger value="mcp-json" className="whitespace-nowrap">
                mcp.json
              </TabsTrigger>
              <TabsTrigger value="claude" className="whitespace-nowrap">
                Claude Code
              </TabsTrigger>
              <TabsTrigger value="gemini" className="whitespace-nowrap">
                Gemini CLI
              </TabsTrigger>
              <TabsTrigger value="codex" className="whitespace-nowrap">
                Codex
              </TabsTrigger>
              <TabsTrigger value="cursor" className="whitespace-nowrap">
                Cursor
              </TabsTrigger>
              <TabsTrigger value="vscode" className="whitespace-nowrap">
                VS Code
              </TabsTrigger>
            </TabsList>
          </div>

          {/* MCP.json - Raw Configuration */}
          <TabsContent value="mcp-json" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  This is the raw MCP server configuration. You can add this to your AI assistant&apos;s configuration
                  file.
                </span>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    1
                  </span>
                  MCP Server Configuration
                </h4>
                <CodeBlock
                  value={JSON.stringify({ mcpServers: { [serverKey]: installationConfig } }, null, 2)}
                  language="json"
                  showCopyButton={true}
                />
              </div>

              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </span>
                  Claude Desktop Installation
                </h4>
                <p className="text-sm text-muted-foreground">
                  For Claude Desktop, paste this configuration into your{" "}
                  <code className="text-xs bg-background px-1.5 py-0.5 rounded border">claude_desktop_config.json</code>{" "}
                  file:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li className="pl-2">Open Claude Desktop Settings → Developer → Edit Config</li>
                  <li className="pl-2">Add the configuration above to the file</li>
                  <li className="pl-2">Save and restart Claude Desktop</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/docs/registry/using-tools"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Complete Installation Guide <ExternalLink className="w-3 h-3" />
                </Link>
                <Link
                  href="https://modelcontextprotocol.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Model Context Protocol Documentation <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </TabsContent>

          {/* Claude Code */}
          <TabsContent value="claude" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Install using the Claude Code CLI. This command will configure the MCP server in your Claude Code
                  settings.
                </span>
              </div>
              {claudeCommand ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        1
                      </span>
                      Install Claude Code CLI
                    </h4>
                    <CodeBlock value="npm install -g @anthropic-ai/claude-code" language="bash" showCopyButton={true} />
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        2
                      </span>
                      Add MCP Server
                    </h4>
                    <CodeBlock value={claudeCommand} language="bash" showCopyButton={true} />
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        3
                      </span>
                      After Installation
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                      <li className="pl-2">
                        If the server requires authentication, use{" "}
                        <code className="text-xs bg-background px-1.5 py-0.5 rounded border">/mcp</code> in Claude Code
                      </li>
                      <li className="pl-2">
                        Verify installation:{" "}
                        <code className="text-xs bg-background px-1.5 py-0.5 rounded border">claude mcp list</code>
                      </li>
                      <li className="pl-2">Start using the server&apos;s tools in your conversations</li>
                    </ol>
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold">Scope Options</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">
                          --scope local
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Available only to you in the current project (default)
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">
                          --scope project
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Shared with everyone via{" "}
                          <code className="text-xs bg-background px-1 py-0.5 rounded">.mcp.json</code> file
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">
                          --scope user
                        </Badge>
                        <span className="text-sm text-muted-foreground">Available to you across all projects</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href="https://docs.claude.com/en/docs/claude-code/mcp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Claude Code MCP Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Installation command not available.</p>
              )}
            </div>
          </TabsContent>

          {/* Gemini CLI */}
          <TabsContent value="gemini" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Install using the Gemini CLI. Requires Gemini CLI to be installed.</span>
              </div>
              {geminiCommand ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        1
                      </span>
                      Install Gemini CLI
                    </h4>
                    <CodeBlock value="npm install -g @google/gemini-cli" language="bash" showCopyButton={true} />
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        2
                      </span>
                      Add MCP Server
                    </h4>
                    <CodeBlock value={geminiCommand} language="bash" showCopyButton={true} />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href="https://github.com/google-gemini/gemini-cli"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Gemini CLI GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      MCP Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Installation command not available.</p>
              )}
            </div>
          </TabsContent>

          {/* OpenAI Codex */}
          <TabsContent value="codex" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Install using the OpenAI Codex CLI. MCP servers can be configured in your local config.</span>
              </div>
              {codexCommand ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        1
                      </span>
                      Install Codex CLI
                    </h4>
                    <CodeBlock value="npm install -g @openai/codex" language="bash" showCopyButton={true} />
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        2
                      </span>
                      Add MCP Server
                    </h4>
                    <CodeBlock value={codexCommand} language="bash" showCopyButton={true} />
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        3
                      </span>
                      After Installation
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                      <li className="pl-2">
                        Run Codex: <code className="text-xs bg-background px-1.5 py-0.5 rounded border">codex</code>
                      </li>
                      <li className="pl-2">The MCP server will be available in your conversations</li>
                      <li className="pl-2">Start using the server&apos;s tools</li>
                    </ol>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href="https://developers.openai.com/codex/cli"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Codex CLI Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://developers.openai.com/codex/mcp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Codex MCP Configuration <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Installation command not available.</p>
              )}
            </div>
          </TabsContent>

          {/* Cursor */}
          <TabsContent value="cursor" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Install using Cursor&apos;s one-click install or add the configuration manually.</span>
              </div>
              {cursorConfig ? (
                <div className="space-y-4">
                  {cursorInstallLink && (
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          1
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="text-sm font-semibold">One-Click Install (Recommended)</h4>
                          <p className="text-sm text-muted-foreground">
                            Install directly in Cursor with a single click:
                          </p>
                          <a
                            href={cursorInstallLink}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium shadow-sm text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Install in Cursor
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        2
                      </span>
                      Manual Configuration
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Alternatively, add this configuration to your Cursor MCP settings:
                    </p>
                    <CodeBlock
                      value={JSON.stringify({ mcpServers: { [serverKey]: cursorConfig } }, null, 2)}
                      language="json"
                      showCopyButton={true}
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href="https://docs.cursor.com/context/mcp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Cursor MCP Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://docs.cursor.com/context/mcp/install-links"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      About MCP Install Links <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Configuration not available.</p>
              )}
            </div>
          </TabsContent>

          {/* VS Code */}
          <TabsContent value="vscode" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Configure the MCP server in VS Code&apos;s Copilot settings.</span>
              </div>
              {vscodeConfig ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        1
                      </span>
                      Open MCP Configuration
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Press{" "}
                      <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">
                        Cmd/Ctrl + Shift + P
                      </kbd>{" "}
                      and search for <strong>&quot;MCP: Open User Configuration&quot;</strong>
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        2
                      </span>
                      Add Server Configuration
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Add this to your{" "}
                      <code className="text-xs bg-background px-1.5 py-0.5 rounded border">mcp.json</code> file:
                    </p>
                    <CodeBlock value={JSON.stringify(vscodeConfig, null, 2)} language="json" showCopyButton={true} />
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        3
                      </span>
                      Restart VS Code
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Reload VS Code for the changes to take effect and start using the MCP server with Copilot.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href="https://code.visualstudio.com/docs/copilot/customization/mcp-servers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      VS Code MCP Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Configuration not available.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
