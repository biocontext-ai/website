import CodeBlock from "@/components/code-block"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SubmissionInstructionsProps {
  serverName: string
  identifier: string
  description?: string
  hasMcpJson?: boolean
  repositoryUrl?: string
  documentationUrl?: string
  licenseUrl?: string
  hasRemoteUrl?: boolean
  showAsAlert?: boolean // Whether to wrap in Alert component with "Next Steps" heading
}

export function SubmissionInstructions({
  serverName,
  identifier,
  description = "",
  hasMcpJson = false,
  repositoryUrl = "",
  documentationUrl = "",
  licenseUrl = "",
  hasRemoteUrl = false,
  showAsAlert = true,
}: SubmissionInstructionsProps) {
  const directoryName = identifier.replace("/", "-")

  // Determine which checks can be pre-filled based on provided data
  const checks = {
    uniqueIdentifier: repositoryUrl ? "x" : " ",
    schemaCompliance: "x",
    repositoryAccess: repositoryUrl ? "x" : " ",
    documentationAccess: documentationUrl ? "x" : " ",
    biomedicalRelevance: " ", // User needs to describe
    openSourceLicense: licenseUrl ? "x" : " ",
    searchDiscoverability: description ? "x" : " ",
    freeAcademicUsage: " ", // User needs to confirm
    nonDuplication: " ", // User needs to confirm
    mcpCompliance: " ", // User needs to confirm
    installationInstructions: hasMcpJson || hasRemoteUrl ? "x" : " ",
    maintained: " ", // User needs to confirm
    functionalityTesting: " ", // User needs to confirm
  }

  const hasPrefilledItems =
    checks.uniqueIdentifier === "x" ||
    checks.repositoryAccess === "x" ||
    checks.documentationAccess === "x" ||
    checks.openSourceLicense === "x" ||
    checks.searchDiscoverability === "x" ||
    checks.installationInstructions === "x"

  const prBodyContent = `Name: ${serverName}

Description: ${description || "[Brief description of what your server does]"}

Please complete the following checklist before submitting your pull request:

- [${checks.uniqueIdentifier}] **Unique Identifier**: The \`id\` field is unique and follows the format \`https://github.com/<github_user>/<repository_name>\`
- [${checks.schemaCompliance}] **Schema Compliance**: The \`meta.yaml\` file fully complies with the schema defined in \`schema.json\`. I have run the \`pre-commit\` hook to confirm.
- [${checks.repositoryAccess}] **Repository Access**: The source code repository URL is publicly accessible
- [${checks.documentationAccess}] **Documentation Access**: The documentation URL is publicly accessible
- [${checks.biomedicalRelevance}] **Biomedical Relevance**: The MCP server provides specific tools for biomedical research or clinical activities (please briefly describe)
- [${checks.openSourceLicense}] **Open Source License**: The server is released under one of the [OSI-approved](https://opensource.org/license) licenses listed in the schema
- [${checks.searchDiscoverability}] **Search Discoverability**: The description and tags enable relevant search queries to find the MCP server
- [${checks.freeAcademicUsage}] **Free Academic Usage**: The services exposed through the MCP server are free for academic research
- [${checks.nonDuplication}] **Non-Duplication**: This is not a fully duplicate effort of an existing BioContextAI registry MCP server (if similar to another server, please explain the unique aspects)
- [${checks.mcpCompliance}] **MCP Compliance**: The server properly implements the Model Context Protocol specification
- [${checks.installationInstructions}] **Installation Instructions**: Clear instructions for installing and running the server are provided
- [${checks.maintained}] **Maintained**: The project is not abandoned
- [${checks.functionalityTesting}] **Functionality Testing**: All exposed tools and resources have been tested and function as expected (manual or unit tests)`

  const prCommand = `gh pr create --title "Add ${serverName} to registry" --body "$(cat <<'EOF'
${prBodyContent}
EOF
)"`

  const content = (
    <div className="space-y-2">
      {showAsAlert && (
        <>
          <p className="font-medium text-sm">Next Steps:</p>
          <p className=" text-muted-foreground">Follow these commands to add your MCP server to the registry:</p>
        </>
      )}

      {showAsAlert && hasPrefilledItems && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2 mt-2">
          <p className=" text-blue-700 dark:text-blue-300">
            Some items are pre-filled based on your form data. Please review and complete the remaining items.
          </p>
        </div>
      )}

      <div className="space-y-3 mt-2">
        <div className="min-w-0">
          <p className=" font-medium mb-1">1. Fork and clone the registry:</p>
          <CodeBlock value="gh repo fork biocontext-ai/registry --clone" language="bash" />
        </div>

        <div className="min-w-0">
          <p className=" font-medium mb-1">2. Navigate to the repository and create a branch:</p>
          <CodeBlock
            value={`cd registry
git checkout -b add-${directoryName}`}
            language="bash"
          />
        </div>

        <div className="min-w-0">
          <p className=" font-medium mb-1">3. Set up the environment:</p>
          <CodeBlock
            value={`uv venv
source .venv/bin/activate
uv sync
uv run pre-commit install`}
            language="bash"
          />
        </div>

        <div className="min-w-0">
          <p className=" font-medium mb-1">4. Create directory and add files:</p>
          <CodeBlock
            value={`mkdir -p servers/${directoryName}
mv ~/Downloads/meta.yaml servers/${directoryName}/${
              hasMcpJson
                ? `
mv ~/Downloads/mcp.json servers/${directoryName}/`
                : ""
            }`}
            language="bash"
          />
        </div>

        <div className="min-w-0">
          <p className=" font-medium mb-1">5. Commit and push:</p>
          <CodeBlock
            value={`git add servers/${directoryName}/
git commit -m "Add ${serverName} to registry"
git push origin add-${directoryName}`}
            language="bash"
          />
        </div>

        <div className="min-w-0">
          <p className=" font-medium mb-1">6. Create a Pull Request:</p>
          {showAsAlert && hasPrefilledItems && (
            <p className=" text-muted-foreground mb-1">
              Note: Some checklist items are pre-filled. Please verify all items and check the remaining boxes. You can
              edit the text as needed in the code block below.
            </p>
          )}
          <CodeBlock value={prCommand} language="bash" editable={showAsAlert} />
        </div>
      </div>

      {hasMcpJson && (
        <p className=" text-muted-foreground mt-2 pt-2 border-t">
          💡 Tip: Share <code className="font-mono text-[0.9em]">mcp.json</code> with your users for easy installation
          in MCP clients like Claude Desktop, Cursor, and VS Code.
        </p>
      )}

      {repositoryUrl && (
        <div className="mt-2 pt-2 border-t">
          <p className=" text-muted-foreground mb-2">
            🏷️ Optional: Add the BioContextAI registry badge to your repository README:
          </p>
          <CodeBlock
            value={`[![BioContextAI - Registry](https://img.shields.io/badge/Registry-package?style=flat&label=BioContextAI&labelColor=%23fff&color=%233555a1&link=https%3A%2F%2Fbiocontext.ai%2Fregistry)](https://biocontext.ai/registry/${identifier})`}
            language="markdown"
          />
        </div>
      )}

      {showAsAlert && (
        <p className=" text-muted-foreground mt-2 pt-2 border-t">
          📚 For more details, see the{" "}
          <a
            href="/docs/registry/contributing"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            full contribution guidelines
          </a>
          .
        </p>
      )}
    </div>
  )

  if (showAsAlert) {
    return (
      <Alert className="">
        <AlertDescription>{content}</AlertDescription>
      </Alert>
    )
  }

  return content
}
