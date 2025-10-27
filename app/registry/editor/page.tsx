"use client"

import { SubmissionInstructions } from "@/components/registry/submission-instructions"
import { defineStepper } from "@/components/stepper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { LicenseMap, OperatingSystemMap, ProgrammingLanguageMap } from "@/lib/maps"
import { ApplicationCategory } from "@prisma/client"
import { AlertCircle, Check, Copy, Download, PlusCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import React, { useState } from "react"
import { useForm, useFormContext } from "react-hook-form"
import { z } from "zod"

// Operating systems and programming languages enums
const licenseIdentifierOptions = Object.values(LicenseMap).map((license) => `https://spdx.org/licenses/${license}.html`)
const operatingSystemOptions = Object.values(OperatingSystemMap)
const programmingLanguageOptions = Object.values(ProgrammingLanguageMap)

// Step-specific schemas for validation
const basicInfoSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.literal("SoftwareApplication"),
  "@id": z.string().url("Must be a valid URI"),
  "identifier": z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, "Must be in format 'owner/repository'"),
  "name": z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  "description": z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters"),
})

const maintainerSchema = z.object({
  maintainer: z
    .array(
      z.object({
        "@type": z.enum(["Person", "Organization"]),
        "name": z.string().min(1, "Name is required"),
        "identifier": z
          .string()
          .transform((val) => (val === "" ? undefined : val))
          .optional(),
        "url": z
          .string()
          .optional()
          .transform((val) => (val === "" ? undefined : val))
          .refine((val) => val === undefined || z.string().url().safeParse(val).success, "Must be a valid URL"),
      }),
    )
    .min(1, "At least one maintainer is required"),
  license: z
    .string()
    .url()
    .refine((val) => val.includes("spdx.org/licenses/"), "Must be a valid SPDX license URL"),
  codeRepository: z
    .string()
    .url()
    .regex(
      /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org|codeberg\.com)(\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+|\/record\/[0-9]+)(\/.*)?$/,
      "Must be a valid repository URL",
    ),
  softwareHelp: z
    .object({
      url: z.string().url("Must be a valid URL"),
      name: z.string().min(1, "Name is required"),
    })
    .optional(),
})

const metadataSchema = z.object({
  applicationCategory: z
    .string()
    .refine(
      (val) => Object.values(ApplicationCategory).includes(val as ApplicationCategory),
      "Must be a valid application category",
    ),
  operatingSystem: z
    .array(
      z
        .string()
        .refine(
          (val) => Object.values(operatingSystemOptions).includes(val as string),
          "Must be a valid operating system",
        ),
    )
    .min(1, "At least one operating system is required")
    .optional(),
  programmingLanguage: z
    .array(
      z
        .string()
        .refine(
          (val) => Object.values(programmingLanguageOptions).includes(val as string),
          "Must be a valid programming language",
        ),
    )
    .min(1, "At least one programming language is required"),
  datePublished: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"))
    .optional(),
  keywords: z
    .array(z.string().max(30, "Keyword must not exceed 30 characters"))
    .max(10, "Maximum 10 keywords allowed")
    .transform((arr) => arr.filter((val) => val.trim() !== ""))
    .optional(),
  featureList: z
    .array(z.string())
    .transform((arr) => arr.filter((val) => val.trim() !== ""))
    .optional(),
  additionalType: z
    .array(z.enum(["https://schema.org/ScholarlyArticle", "https://schema.org/SoftwareSourceCode"]))
    .optional(),
})

const installationSchema = z.object({
  url: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => val === undefined || z.string().url().safeParse(val).success, "Must be a valid URL"),
  installationType: z.enum(["none", "npm", "python"]).optional(),
  npmPackage: z.string().optional(),
  pythonPackage: z.string().optional(),
  mcpCommand: z.string().optional(),
  mcpArgs: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return val || []
    }),
  mcpEnv: z
    .union([z.string(), z.record(z.string())])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val)
          return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
        } catch {
          return {}
        }
      }
      return val || {}
    }),
})

// Complete schema for final validation
const mcpServerSchema = basicInfoSchema.merge(maintainerSchema).merge(metadataSchema).merge(installationSchema)

type McpServerFormValues = z.infer<typeof mcpServerSchema>

// Centralized field labels - used for both form labels and error messages
const FIELD_LABELS = {
  "@id": "Repository URL",
  "identifier": "Repository Identifier",
  "name": "Server Name",
  "description": "Description",
  "maintainer": "Maintainer",
  "maintainer.@type": "Type",
  "maintainer.name": "Name",
  "maintainer.identifier": "Identifier",
  "maintainer.url": "URL",
  "license": "License",
  "codeRepository": "Code Repository",
  "softwareHelp.url": "Documentation URL",
  "softwareHelp.name": "Documentation Name",
  "applicationCategory": "Category",
  "operatingSystem": "Operating Systems",
  "programmingLanguage": "Programming Languages",
  "datePublished": "Date Published",
  "keywords": "Keyword",
  "featureList": "Feature",
  "url": "Remote Server URL",
  "installationType": "Package Type",
  "npmPackage": "NPM Package Name",
  "pythonPackage": "Python Package Name",
  "mcpCommand": "Command",
  "mcpArgs": "Arguments",
  "mcpEnv": "Environment Variables",
} as const

// Helper function to get human-readable field label from path
function getFieldLabel(path: string): string {
  // Handle array indices (e.g., "maintainer.0.name" -> "Maintainer 1 - Name")
  const parts = path.split(".")

  if (parts.length === 1) {
    return FIELD_LABELS[path as keyof typeof FIELD_LABELS] || path
  }

  // Build the label from parts
  const labels: string[] = []
  let currentPath = ""

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isNumber = /^\d+$/.test(part)

    if (isNumber) {
      // Add 1 to make it human-readable (0 -> 1)
      const index = parseInt(part) + 1
      labels[labels.length - 1] = `${labels[labels.length - 1]} ${index}`
    } else {
      currentPath = currentPath ? `${currentPath}.${part}` : part

      // Try to find exact match first, then fall back to part name
      const label =
        FIELD_LABELS[currentPath as keyof typeof FIELD_LABELS] ||
        FIELD_LABELS[part as keyof typeof FIELD_LABELS] ||
        part
      labels.push(label)
    }
  }

  return labels.join(" - ")
} // Helper function to extract repo info from URL
function extractRepoInfo(url: string) {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/").filter((p) => p)

    if (pathParts.length >= 2) {
      const owner = pathParts[0]
      const repo = pathParts[1]
      return {
        identifier: `${owner}/${repo}`,
        codeRepository: `${urlObj.origin}/${owner}/${repo}`,
        softwareHelpUrl: `${urlObj.origin}/${owner}/${repo}#readme`,
        maintainerIdentifier: owner,
        maintainerUrl: `${urlObj.origin}/${owner}`,
      }
    }
  } catch (e) {
    // Invalid URL, return empty
  }
  return null
}

// Define stepper with shorter labels
const { Stepper, useStepper } = defineStepper(
  { id: "basic", title: "Basic Info" },
  { id: "maintainers", title: "Details" },
  { id: "metadata", title: "Metadata" },
  { id: "installation", title: "Installation" },
  { id: "review", title: "Review" },
)

export default function McpServerEditorPage() {
  const { toast } = useToast()
  const [stepErrors, setStepErrors] = useState<string[]>([])

  const form = useForm<McpServerFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": "",
      "identifier": "",
      "name": "",
      "description": "",
      "codeRepository": "",
      "softwareHelp": {
        url: "",
        name: "Documentation",
      },
      "maintainer": [
        {
          "@type": "Person",
          "name": "",
          "identifier": "",
          "url": "",
        },
      ],
      "license": "https://spdx.org/licenses/MIT.html",
      "keywords": [""],
      "applicationCategory": "HealthApplication",
      "operatingSystem": ["Cross-platform"],
      "programmingLanguage": ["Python"],
      "featureList": [""],
      "additionalType": ["https://schema.org/SoftwareSourceCode"],
      "datePublished": new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
      "url": "",
      "installationType": "none",
      "npmPackage": "",
      "pythonPackage": "",
      "mcpCommand": "",
      "mcpArgs": [],
      "mcpEnv": {},
    },
  })

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Add your MCP server</h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Complete the steps below to generate a <code className="font-mono text-[0.9em]">meta.yaml</code> and a{" "}
            <code className="font-mono text-[0.9em]">mcp.json</code> file in just 2 minutes with intelligent
            pre-filling.{" "}
            <Link href="https://biocontext.ai/docs/registry/contributing" className="text-blue-600 hover:underline">
              Learn more
            </Link>
          </p>
        </div>

        <Form {...form}>
          <Stepper.Provider>
            {({ methods }) => (
              <div className="space-y-6">
                {/* Stepper Navigation */}
                <nav aria-label="MCP Server Registration Steps" className="py-4">
                  <ol className="flex items-center justify-between gap-1 md:gap-2 overflow-x-auto pb-2">
                    {methods.all.map((step, index, array) => {
                      const currentIndex = methods.all.findIndex((s) => s.id === methods.current.id)
                      const isCompleted = index < currentIndex
                      const isCurrent = index === currentIndex

                      return (
                        <React.Fragment key={step.id}>
                          <li className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <Button
                              type="button"
                              role="tab"
                              variant={isCompleted || isCurrent ? "default" : "secondary"}
                              aria-current={isCurrent ? "step" : undefined}
                              aria-posinset={index + 1}
                              aria-setsize={methods.all.length}
                              aria-selected={isCurrent}
                              className={`flex size-9 md:size-10 items-center justify-center rounded-full transition-all flex-shrink-0 ${
                                isCompleted ? "bg-green-600 hover:bg-green-700" : ""
                              }`}
                              onClick={async () => {
                                // Allow navigation back
                                if (index <= currentIndex) {
                                  setStepErrors([])
                                  methods.goTo(step.id)
                                } else {
                                  // Validate current step before moving forward
                                  const currentStep = methods.current.id
                                  const { valid, errors } = await validateStep(currentStep, form)
                                  if (valid) {
                                    setStepErrors([])
                                    methods.goTo(step.id)
                                  } else {
                                    setStepErrors(errors)
                                    toast({
                                      title: "Validation Error",
                                      description: "Please fix the errors in the current step before proceeding.",
                                      variant: "destructive",
                                    })
                                  }
                                }
                              }}
                            >
                              {isCompleted ? (
                                <Check className="w-4 h-4 md:w-5 md:h-5" />
                              ) : (
                                <span className="text-xs md:text-sm">{index + 1}</span>
                              )}
                            </Button>
                            <span
                              className={`text-[0.65rem] md:text-xs font-medium text-center whitespace-nowrap ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {step.title}
                            </span>
                          </li>
                          {index < array.length - 1 && (
                            <Separator
                              className={`flex-1 h-0.5 mb-6 md:mb-8 transition-colors min-w-[20px] md:min-w-[40px] ${
                                isCompleted ? "bg-green-600" : "bg-muted"
                              }`}
                            />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </ol>
                </nav>

                {/* Step Content */}
                <div className="min-h-[500px]">
                  {stepErrors.length > 0 && (
                    <Alert variant="destructive" className="mb-6 -mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">Please fix the following errors:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs">
                            {stepErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  {methods.switch({
                    basic: () => <BasicInformationStep />,
                    maintainers: () => <MaintainersLicenseStep />,
                    metadata: () => <MetadataStep />,
                    installation: () => <InstallationStep />,
                    review: () => <ReviewDownloadStep />,
                  })}
                </div>

                {/* Controls */}
                <div className="flex justify-between pt-6 border-t">
                  <Button type="button" variant="outline" onClick={methods.prev} disabled={methods.isFirst}>
                    Previous
                  </Button>
                  {!methods.isLast ? (
                    <Button
                      type="button"
                      onClick={async () => {
                        const { valid, errors } = await validateStep(methods.current.id, form)
                        if (valid) {
                          setStepErrors([])
                          methods.next()
                        } else {
                          setStepErrors(errors)
                          toast({
                            title: "Validation Error",
                            description: "Please fix the errors before proceeding to the next step.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Next Step
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </Stepper.Provider>
        </Form>
      </div>
    </div>
  )
}

// Validation helper
async function validateStep(stepId: string, form: ReturnType<typeof useForm<McpServerFormValues>>) {
  const values = form.getValues()

  try {
    switch (stepId) {
      case "basic": {
        const basicValues = {
          "@context": values["@context"],
          "@type": values["@type"],
          "@id": values["@id"],
          "identifier": values.identifier,
          "name": values.name,
          "description": values.description,
        }
        await basicInfoSchema.parseAsync(basicValues)
        return { valid: true, errors: [] }
      }
      case "maintainers": {
        const maintainerValues = {
          maintainer: values.maintainer,
          license: values.license,
          codeRepository: values.codeRepository,
          softwareHelp: values.softwareHelp,
        }
        await maintainerSchema.parseAsync(maintainerValues)
        return { valid: true, errors: [] }
      }
      case "metadata": {
        const metadataValues = {
          applicationCategory: values.applicationCategory,
          operatingSystem: values.operatingSystem,
          programmingLanguage: values.programmingLanguage,
          datePublished: values.datePublished,
          keywords: values.keywords,
          featureList: values.featureList,
          additionalType: values.additionalType,
        }
        await metadataSchema.parseAsync(metadataValues)
        return { valid: true, errors: [] }
      }
      case "installation": {
        const installationValues = {
          url: values.url,
          installationType: values.installationType,
          npmPackage: values.npmPackage,
          pythonPackage: values.pythonPackage,
          mcpCommand: values.mcpCommand,
          mcpArgs: values.mcpArgs,
          mcpEnv: values.mcpEnv,
        }
        await installationSchema.parseAsync(installationValues)
        return { valid: true, errors: [] }
      }
      default:
        return { valid: true, errors: [] }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join(".")
        const fieldLabel = getFieldLabel(path)
        return `${fieldLabel}: ${err.message}`
      })
      return { valid: false, errors: errorMessages }
    }
    return { valid: false, errors: ["Unknown validation error"] }
  }
}

// Step Components

function BasicInformationStep() {
  const form = useFormContext<McpServerFormValues>()

  // Auto-fill helper
  const handleIdChange = (value: string) => {
    form.setValue("@id", value)

    const repoInfo = extractRepoInfo(value)
    if (repoInfo) {
      // Auto-fill if fields are empty
      if (!form.getValues("identifier")) {
        form.setValue("identifier", repoInfo.identifier)
      }
      if (!form.getValues("codeRepository")) {
        form.setValue("codeRepository", repoInfo.codeRepository)
      }
      if (!form.getValues("softwareHelp")?.url) {
        form.setValue("softwareHelp.url", repoInfo.softwareHelpUrl)
        form.setValue("softwareHelp.name", "Documentation")
      }
      // Auto-fill first maintainer's identifier and URL if empty
      if (!form.getValues("maintainer.0.identifier")) {
        form.setValue("maintainer.0.identifier", repoInfo.maintainerIdentifier)
      }
      if (!form.getValues("maintainer.0.url")) {
        form.setValue("maintainer.0.url", repoInfo.maintainerUrl)
      }
    }
  }

  return (
    <Card className="border-none shadow-none bg-inherit">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Basic Information</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Core details about your MCP server</p>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <FormField
          control={form.control}
          name="@id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{FIELD_LABELS["@id"]} *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://github.com/username/repo-name"
                  {...field}
                  onChange={(e) => handleIdChange(e.target.value)}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Enter your GitHub/GitLab repository URL - we&apos;ll auto-fill related fields
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{FIELD_LABELS.identifier} *</FormLabel>
              <FormControl>
                <Input placeholder="username/repository-name" {...field} />
              </FormControl>
              <FormDescription className="text-xs">Format: owner/repository</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{FIELD_LABELS.name} *</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome MCP Server" {...field} />
              </FormControl>
              <FormDescription className="text-xs">1-100 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{FIELD_LABELS.description} *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what your MCP server does..."
                  className="min-h-[80px] text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">10-1000 characters, unformatted text (no markdown)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

function MaintainersLicenseStep() {
  const form = useFormContext<McpServerFormValues>()

  const addMaintainer = () => {
    const current = form.getValues("maintainer")
    form.setValue("maintainer", [...current, { "@type": "Person", "name": "", "identifier": "", "url": "" }])
  }

  const removeMaintainer = (index: number) => {
    const current = form.getValues("maintainer")
    if (current.length > 1) {
      form.setValue(
        "maintainer",
        current.filter((_: any, i: number) => i !== index),
      )
    }
  }

  return (
    <div className="space-y-3">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Maintainers</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">People or organizations maintaining this server</p>
        </CardHeader>
        <CardContent className="px-0 space-y-3">
          {form.watch("maintainer").map((_, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-medium text-muted-foreground">Maintainer {index + 1}</h4>
                {form.watch("maintainer").length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMaintainer(index)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`maintainer.${index}.@type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{FIELD_LABELS["maintainer.@type"]} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Person">Person</SelectItem>
                          <SelectItem value="Organization">Organization</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintainer.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{FIELD_LABELS["maintainer.name"]} *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintainer.${index}.identifier`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{FIELD_LABELS["maintainer.identifier"]}</FormLabel>
                      <FormControl>
                        <Input placeholder="ORCID/GitHub username" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintainer.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{FIELD_LABELS["maintainer.url"]}</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMaintainer}>
            <PlusCircle className="w-3 h-3 mr-2" />
            Add Maintainer
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">License</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Select the license for your code</p>
        </CardHeader>
        <CardContent className="px-0">
          <FormField
            control={form.control}
            name="license"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.license} *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select a license" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {licenseIdentifierOptions.map((license) => (
                      <SelectItem key={license} value={license}>
                        {license.replace("https://spdx.org/licenses/", "").replace(".html", "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">SPDX license identifier</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Code Repository</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Where your source code is hosted</p>
        </CardHeader>
        <CardContent className="px-0">
          <FormField
            control={form.control}
            name="codeRepository"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.codeRepository} *</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/username/repo-name" {...field} />
                </FormControl>
                <FormDescription className="text-xs">GitHub, GitLab, Bitbucket, or Codeberg URL</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Documentation</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Link to your documentation (optional)</p>
        </CardHeader>
        <CardContent className="px-0 space-y-3">
          <FormField
            control={form.control}
            name="softwareHelp.url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS["softwareHelp.url"]}</FormLabel>
                <FormControl>
                  <Input placeholder="https://docs.example.com" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="softwareHelp.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS["softwareHelp.name"]}</FormLabel>
                <FormControl>
                  <Input placeholder="Documentation" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function MetadataStep() {
  const form = useFormContext<McpServerFormValues>()

  const addKeyword = () => {
    const current = form.getValues("keywords") || []
    if (current.length < 10) {
      form.setValue("keywords", [...current, ""])
    }
  }

  const removeKeyword = (index: number) => {
    const current = form.getValues("keywords") || []
    form.setValue(
      "keywords",
      current.filter((_: any, i: number) => i !== index),
    )
  }

  const addFeature = () => {
    const current = form.getValues("featureList") || []
    form.setValue("featureList", [...current, ""])
  }

  const removeFeature = (index: number) => {
    const current = form.getValues("featureList") || []
    form.setValue(
      "featureList",
      current.filter((_: any, i: number) => i !== index),
    )
  }

  return (
    <div className="space-y-3">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Category & Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-3">
          <FormField
            control={form.control}
            name="applicationCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.applicationCategory} *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ApplicationCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operatingSystem"
            render={() => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.operatingSystem}</FormLabel>
                <FormDescription className="text-xs">Select all supported platforms</FormDescription>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {operatingSystemOptions.map((os) => (
                    <FormField
                      key={os}
                      control={form.control}
                      name="operatingSystem"
                      render={({ field }) => {
                        return (
                          <FormItem key={os} className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(os)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), os])
                                    : field.onChange(field.value?.filter((value: string) => value !== os))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-normal">{os}</FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="programmingLanguage"
            render={() => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.programmingLanguage} *</FormLabel>
                <FormDescription className="text-xs">Select all languages used</FormDescription>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {programmingLanguageOptions.map((lang) => (
                    <FormField
                      key={lang}
                      control={form.control}
                      name="programmingLanguage"
                      render={({ field }) => {
                        return (
                          <FormItem key={lang} className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(lang)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), lang])
                                    : field.onChange(field.value?.filter((value: string) => value !== lang))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-normal">{lang}</FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="datePublished"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.datePublished}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="text-sm" />
                </FormControl>
                <FormDescription className="text-xs">Publication or listing date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Keywords</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Tags for discovery (max 10)</p>
        </CardHeader>
        <CardContent className="px-0 space-y-2">
          {(form.watch("keywords") || []).map((_, index) => (
            <div key={index} className="flex gap-2">
              <FormField
                control={form.control}
                name={`keywords.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="e.g., Knowledgebase" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeKeyword(index)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {(form.watch("keywords") || []).length < 10 && (
            <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
              <PlusCircle className="w-3 h-3 mr-2" />
              Add Keyword
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Features</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Main features/services (optional)</p>
        </CardHeader>
        <CardContent className="px-0 space-y-2">
          {(form.watch("featureList") || []).map((_, index) => (
            <div key={index} className="flex gap-2">
              <FormField
                control={form.control}
                name={`featureList.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="e.g., UniProt" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <PlusCircle className="w-3 h-3 mr-2" />
            Add Feature
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function InstallationStep() {
  const form = useFormContext<McpServerFormValues>()

  const handlePackageChange = (packageName: string, packageType: "npm" | "python", previousPackageName: string) => {
    const currentCommand = form.getValues("mcpCommand")
    const currentArgs = form.getValues("mcpArgs")

    // If package name is removed, clear the auto-filled fields
    if (!packageName || packageName.trim() === "") {
      // Only clear if they match the expected auto-filled values
      if (packageType === "npm" && currentCommand === "npx") {
        form.setValue("mcpCommand", "")
        form.setValue("mcpArgs", [])
      } else if (packageType === "python" && currentCommand === "uvx") {
        form.setValue("mcpCommand", "")
        form.setValue("mcpArgs", [])
      }
      return
    }

    // Helper to check if args were auto-generated based on the previous package name
    const isAutoGeneratedArgs = (args: any, type: "npm" | "python", prevPkg: string) => {
      if (!Array.isArray(args)) return false
      if (!prevPkg) return args.length === 0 // Empty is considered auto-generated

      if (type === "npm") {
        // Check if it matches the npm pattern: ["-y", previousPackageName]
        return args.length === 2 && args[0] === "-y" && args[1] === prevPkg
      } else if (type === "python") {
        // Check if it matches the python pattern: [previousPackageName]
        return args.length === 1 && args[0] === prevPkg
      }
      return false
    }

    const isEmptyCommand = !currentCommand || currentCommand.trim() === ""
    const isEmptyArgs = !currentArgs || (Array.isArray(currentArgs) && currentArgs.length === 0)
    const shouldUpdateArgs = isEmptyArgs || isAutoGeneratedArgs(currentArgs, packageType, previousPackageName)

    if (packageType === "npm" && packageName) {
      if (isEmptyCommand || currentCommand === "npx") {
        form.setValue("mcpCommand", "npx")
      }
      if (shouldUpdateArgs) {
        form.setValue("mcpArgs", ["-y", packageName])
      }
    } else if (packageType === "python" && packageName) {
      if (isEmptyCommand || currentCommand === "uvx") {
        form.setValue("mcpCommand", "uvx")
      }
      if (shouldUpdateArgs) {
        form.setValue("mcpArgs", [packageName])
      }
    }
  }

  return (
    <div className="space-y-3">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Installation Instructions</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Configure how users can install your MCP server</p>
        </CardHeader>
        <CardContent className="px-0 space-y-3">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.url} (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://mcp.biocontext.ai/mcp/" {...field} className="text-sm" />
                </FormControl>
                <FormDescription className="text-xs">For streamable HTTP installation</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="installationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{FIELD_LABELS.installationType}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select package type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No package</SelectItem>
                    <SelectItem value="npm">NPM Package</SelectItem>
                    <SelectItem value="python">Python Package</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">Select if your server is available as a package</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("installationType") === "npm" && (
            <FormField
              control={form.control}
              name="npmPackage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{FIELD_LABELS.npmPackage}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="@org/package-name"
                      {...field}
                      onChange={(e) => {
                        const previousValue = field.value || ""
                        field.onChange(e)
                        handlePackageChange(e.target.value, "npm", previousValue)
                      }}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Full npm package name (e.g., @modelcontextprotocol/server-example)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.watch("installationType") === "python" && (
            <FormField
              control={form.control}
              name="pythonPackage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{FIELD_LABELS.pythonPackage}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mcp-server-example"
                      {...field}
                      onChange={(e) => {
                        const previousValue = field.value || ""
                        field.onChange(e)
                        handlePackageChange(e.target.value, "python", previousValue)
                      }}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">PyPI package name (e.g., mcp-server-example)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.watch("installationType") && form.watch("installationType") !== "none" && (
            <>
              <Separator className="my-3" />

              <div className="space-y-3">
                <FormLabel className="text-sm">MCP Configuration (Optional)</FormLabel>
                <p className="text-xs text-muted-foreground">
                  These fields will generate an mcp.json file for easy client configuration
                </p>

                <FormField
                  control={form.control}
                  name="mcpCommand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{FIELD_LABELS.mcpCommand}</FormLabel>
                      <FormControl>
                        <Input placeholder="npx, uvx or python" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mcpArgs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        {FIELD_LABELS.mcpArgs} (JSON array)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='["arg1", "arg2"]'
                          className="text-sm font-mono"
                          value={Array.isArray(field.value) ? JSON.stringify(field.value, null, 2) : field.value || ""}
                          onChange={(e) => {
                            // Store raw string value to allow editing
                            field.onChange(e.target.value)
                          }}
                          onBlur={(e) => {
                            // Try to parse on blur
                            try {
                              const parsed = JSON.parse(e.target.value)
                              if (Array.isArray(parsed)) {
                                field.onChange(parsed)
                              }
                            } catch (err) {
                              // Keep raw string value if invalid JSON
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Enter a JSON array, e.g., [&quot;package_name&quot;]
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mcpEnv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        {FIELD_LABELS.mcpEnv} (JSON object)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='{"KEY": "value"}'
                          className="text-sm font-mono"
                          value={
                            typeof field.value === "object" && !Array.isArray(field.value)
                              ? JSON.stringify(field.value, null, 2)
                              : field.value || ""
                          }
                          onChange={(e) => {
                            // Store raw string value to allow editing
                            field.onChange(e.target.value)
                          }}
                          onBlur={(e) => {
                            // Try to parse on blur
                            try {
                              const parsed = JSON.parse(e.target.value)
                              if (typeof parsed === "object" && !Array.isArray(parsed)) {
                                field.onChange(parsed)
                              }
                            } catch (err) {
                              // Keep raw string value if invalid JSON
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Enter a JSON object, e.g., {`{"KEY": "value"}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewDownloadStep() {
  const form = useFormContext<McpServerFormValues>()
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)
  const [isMcpCopied, setIsMcpCopied] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const values = form.watch()

  // Generate YAML preview
  const generateYaml = (values: McpServerFormValues) => {
    const cleanValues = {
      ...values,
      maintainer: values.maintainer.filter((m) => m.name.trim()),
      keywords: values.keywords?.filter((k) => k.trim()),
      featureList: values.featureList?.filter((f) => f.trim()) || undefined,
      softwareHelp: values.softwareHelp?.url && values.softwareHelp?.name ? values.softwareHelp : undefined,
      datePublished: values.datePublished || undefined,
      // Always include SoftwareSourceCode since codeRepository is required
      additionalType: ["https://schema.org/SoftwareSourceCode"],
      url: values.url || undefined,
    }

    const yamlLines = [
      `"@context": ${cleanValues["@context"]}`,
      `"@type": ${cleanValues["@type"]}`,
      `"@id": ${cleanValues["@id"]}`,
      "",
    ]

    if (cleanValues.additionalType?.length) {
      yamlLines.push("additionalType:")
      cleanValues.additionalType.forEach((type) => yamlLines.push(`  - ${type}`))
      yamlLines.push("")
    }

    yamlLines.push(
      `identifier: ${cleanValues.identifier}`,
      "",
      `name: ${cleanValues.name}`,
      "",
      `description: >`,
      ...cleanValues.description.split("\n").map((line: string) => `  ${line}`),
      "",
      `codeRepository: ${cleanValues.codeRepository}`,
      "",
    )

    if (cleanValues.url) {
      yamlLines.push(`url: ${cleanValues.url}`, "")
    }

    if (cleanValues.softwareHelp) {
      yamlLines.push("softwareHelp:", `  "@type": CreativeWork`)
      yamlLines.push(`  url: ${cleanValues.softwareHelp.url}`)
      yamlLines.push(`  name: ${cleanValues.softwareHelp.name}`)
      yamlLines.push("")
    }

    yamlLines.push("maintainer:")
    cleanValues.maintainer.forEach((maintainer) => {
      yamlLines.push(`  - "@type": ${maintainer["@type"]}`)
      yamlLines.push(`    name: ${maintainer.name}`)
      if (maintainer.identifier) yamlLines.push(`    identifier: ${maintainer.identifier}`)
      if (maintainer.url) yamlLines.push(`    url: ${maintainer.url}`)
    })

    yamlLines.push("", `license: ${cleanValues.license}`)
    yamlLines.push("", `applicationCategory: ${cleanValues.applicationCategory}`)

    if (cleanValues.keywords?.length) {
      yamlLines.push("", "keywords:")
      cleanValues.keywords.forEach((keyword) => yamlLines.push(`  - ${keyword}`))
    }

    if (cleanValues.datePublished) {
      yamlLines.push("", `datePublished: "${cleanValues.datePublished}"`)
    }

    if (cleanValues.operatingSystem?.length) {
      yamlLines.push("", "operatingSystem:")
      cleanValues.operatingSystem.forEach((os) => yamlLines.push(`  - ${os}`))
    }

    yamlLines.push("", "programmingLanguage:")
    cleanValues.programmingLanguage.forEach((lang) => yamlLines.push(`  - ${lang}`))

    if (cleanValues.featureList?.length) {
      yamlLines.push("", "featureList:")
      cleanValues.featureList.forEach((feature) => yamlLines.push(`  - ${feature}`))
    }

    return yamlLines.join("\n").replace(/[ \t]+$/gm, "") + "\n"
  }

  const previewYaml = generateYaml(values)

  // Generate MCP JSON if installation type is selected and has meaningful content
  const generateMcpJson = (values: McpServerFormValues) => {
    // Check if there's any meaningful configuration
    const hasCommand = values.mcpCommand && values.mcpCommand.trim() !== ""
    const hasArgs = values.mcpArgs && values.mcpArgs.length > 0
    const hasEnv = values.mcpEnv && Object.keys(values.mcpEnv).length > 0
    const hasRemoteUrl = values.url && values.url.trim() !== ""

    // If no package type is selected but we have a remote URL, use mcp-remote
    if ((!values.installationType || values.installationType === "none") && hasRemoteUrl) {
      const serverName = values.identifier

      const config = {
        mcpServers: {
          [serverName]: {
            command: "npx",
            args: ["mcp-remote", values.url],
          },
        },
      }

      return JSON.stringify(config, null, 2)
    }

    // If no package type, return null
    if (!values.installationType || values.installationType === "none") {
      return null
    }

    // Only generate if there's at least a command or it has meaningful configuration
    if (!hasCommand && !hasArgs && !hasEnv) {
      return null
    }

    // Use identifier as the server name (e.g., "owner/repo")
    const serverName = values.identifier

    const config: any = {
      mcpServers: {
        [serverName]: {},
      },
    }

    if (hasCommand) {
      config.mcpServers[serverName].command = values.mcpCommand
    }

    if (hasArgs) {
      config.mcpServers[serverName].args = values.mcpArgs
    }

    if (hasEnv) {
      config.mcpServers[serverName].env = values.mcpEnv
    }

    return JSON.stringify(config, null, 2)
  }

  const previewMcpJson = generateMcpJson(values)

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(previewYaml)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: "Copied to clipboard",
        description: "The meta.yaml content has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleCopyMcpJson = async () => {
    if (!previewMcpJson) return

    try {
      await navigator.clipboard.writeText(previewMcpJson)
      setIsMcpCopied(true)
      setTimeout(() => setIsMcpCopied(false), 2000)
      toast({
        title: "Copied to clipboard",
        description: "The mcp.json content has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadMetaYaml = async () => {
    setIsValidating(true)
    try {
      const values = form.getValues()
      await mcpServerSchema.parseAsync(values)
      setValidationErrors([])

      const yaml = generateYaml(values)
      const blob = new Blob([yaml], { type: "text/yaml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "meta.yaml"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: "meta.yaml file has been downloaded.",
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
        setValidationErrors(errors)
        toast({
          title: "Validation Failed",
          description: `Found ${errors.length} error(s). Please fix them before downloading.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Download Error",
          description: "Failed to download the file.",
          variant: "destructive",
        })
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleDownloadMcpJson = async () => {
    if (!previewMcpJson) return

    setIsValidating(true)
    try {
      const values = form.getValues()
      await mcpServerSchema.parseAsync(values)
      setValidationErrors([])

      const blob = new Blob([previewMcpJson], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "mcp.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: "mcp.json file has been downloaded.",
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
        setValidationErrors(errors)
        toast({
          title: "Validation Failed",
          description: `Found ${errors.length} error(s). Please fix them before downloading.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Download Error",
          description: "Failed to download the file.",
          variant: "destructive",
        })
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleDownloadAll = async () => {
    await handleDownloadMetaYaml()
    if (previewMcpJson) {
      setTimeout(() => handleDownloadMcpJson(), 100)
    }
  }

  return (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-xs">Please fix these issues:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-xs">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl flex items-center gap-2">
            Preview <code className="font-mono text-sm text-muted-foreground">meta.yaml</code>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="relative group">
            <button
              onClick={handleCopyYaml}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Copy YAML content"
            >
              {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto border">
              {previewYaml}
            </pre>
          </div>
        </CardContent>
      </Card>

      {previewMcpJson && (
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-xl flex items-center gap-2">
              Preview <code className="font-mono text-sm text-muted-foreground">mcp.json</code>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">MCP client configuration for easy installation</p>
          </CardHeader>
          <CardContent className="px-0">
            <div className="relative group">
              <button
                onClick={handleCopyMcpJson}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Copy JSON content"
              >
                {isMcpCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto border">
                {previewMcpJson}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {previewMcpJson ? (
          <>
            <Button onClick={handleDownloadAll} disabled={isValidating} size="lg" className="gap-2">
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Both Files
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadMetaYaml}
              disabled={isValidating}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              meta.yaml only
            </Button>

            <Button
              onClick={handleDownloadMcpJson}
              disabled={isValidating}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              mcp.json only
            </Button>
          </>
        ) : (
          <Button onClick={handleDownloadMetaYaml} disabled={isValidating} size="lg" className="gap-2">
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Validating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download meta.yaml
              </>
            )}
          </Button>
        )}
      </div>

      <SubmissionInstructions
        serverName={values.name}
        identifier={values.identifier}
        description={values.description}
        hasMcpJson={!!previewMcpJson}
        repositoryUrl={values.codeRepository}
        documentationUrl={values.softwareHelp?.url}
        licenseUrl={values.license}
        hasRemoteUrl={!!(values.url && values.url.trim())}
      />
    </div>
  )
}
