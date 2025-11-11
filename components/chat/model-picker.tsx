"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useChatStore } from "@/stores/chat"
import { UIMessage } from "ai"
import { AlertTriangle, Key, X, Zap } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useShallow } from "zustand/react/shallow"
import Claude from "../icons/claude"
import Gemini from "../icons/gemini"
import OpenAI from "../icons/openai"

interface ModelOption {
  id: string
  name: string
  provider: "google" | "openai" | "anthropic" | "groq"
  requiresApiKey: boolean
  supportsOptionalApiKey?: boolean
  description?: string
  badge?: string
  icon?: React.ReactNode
}

const models: ModelOption[] = [
  {
    id: "gemini-2.5-flash-latest",
    name: "Gemini 2.5 Flash",
    provider: "google",
    requiresApiKey: false,
    supportsOptionalApiKey: true,
    description: "Free with community key, or use your own API key for higher limits",
    badge: "Free",
    icon: <Gemini className="h-4 w-4 mr-2" />,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    requiresApiKey: true,
    description: "Lower cost Anthropic model",
    badge: "API Key Required",
    icon: <Claude className="h-4 w-4 mr-2" />,
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    requiresApiKey: true,
    description: "Performant Anthropic model",
    badge: "API Key Required",
    icon: <Claude className="h-4 w-4 mr-2" />,
  },
  {
    id: "claude-opus-4-1-20250805",
    name: "Claude Opus 4.1",
    provider: "anthropic",
    requiresApiKey: true,
    description: "Largest Anthropic model",
    badge: "API Key Required",
    icon: <Claude className="h-4 w-4 mr-2" />,
  },
  {
    id: "gpt-4.1-mini-2025-04-14",
    name: "GPT-4.1 Mini",
    provider: "openai",
    requiresApiKey: true,
    description: "Cost-effective OpenAI model",
    badge: "API Key Required",
    icon: <OpenAI className="h-4 w-4 mr-2" />,
  },
  {
    id: "gpt-4.1-2025-04-14",
    name: "GPT-4.1",
    provider: "openai",
    requiresApiKey: true,
    description: "Capable OpenAI model",
    badge: "API Key Required",
    icon: <OpenAI className="h-4 w-4 mr-2" />,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    requiresApiKey: true,
    description: "New and cost-optimized OpenAI model",
    badge: "API Key Required",
    icon: <OpenAI className="h-4 w-4 mr-2" />,
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    requiresApiKey: true,
    description: "Newest & most capable OpenAI model",
    badge: "API Key Required",
    icon: <OpenAI className="h-4 w-4 mr-2" />,
  },
  {
    id: "groq-moonshotai/kimi-k2-instruct-0905",
    name: "Kimi K2 instruct (Groq)",
    provider: "groq",
    requiresApiKey: true,
    description: "Fast inference with Groq",
    badge: "API Key Required",
    icon: <Zap className="h-4 w-4 mr-2" />,
  },
]

type ModelPickerProps = {
  setMessages: (messages: UIMessage[]) => void
}

export default function ModelPicker({ setMessages }: ModelPickerProps) {
  // Use Zustand store
  const selectedModel = useChatStore(useShallow((state) => state.selectedModel))
  const googleApiKey = useChatStore(useShallow((state) => state.googleApiKey))
  const openaiApiKey = useChatStore(useShallow((state) => state.openaiApiKey))
  const anthropicApiKey = useChatStore(useShallow((state) => state.anthropicApiKey))
  const groqApiKey = useChatStore(useShallow((state) => state.groqApiKey))
  const setSelectedModel = useChatStore(useShallow((state) => state.setSelectedModel))
  const setApiKeyForProvider = useChatStore(useShallow((state) => state.setApiKeyForProvider))

  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [tempApiKey, setTempApiKey] = useState("")
  const [pendingModel, setPendingModel] = useState<string>("")

  // Get the default free model to switch to
  const defaultFreeModel = models.find((m) => m.id === "gemini-2.5-flash-latest")!

  const currentModel = models.find((m) => m.id === selectedModel)

  // Get API key for current model's provider
  const getApiKeyForProvider = (provider: "google" | "openai" | "anthropic" | "groq") => {
    if (provider === "openai") return openaiApiKey
    if (provider === "anthropic") return anthropicApiKey
    if (provider === "groq") return groqApiKey
    return googleApiKey
  }

  // Get API key for current model
  const apiKey = currentModel ? getApiKeyForProvider(currentModel.provider) : null

  const handleSetSelectedModel = (modelId: string) => {
    setSelectedModel(modelId)
  }

  const handleModelChange = (modelId: string) => {
    const model = models.find((m) => m.id === modelId)
    if (!model) return

    // Get the API key for the target model
    let targetApiKey: string | null = null
    if (model.provider === "openai") {
      targetApiKey = openaiApiKey
    } else if (model.provider === "anthropic") {
      targetApiKey = anthropicApiKey
    } else if (model.provider === "groq") {
      targetApiKey = groqApiKey
    } else {
      targetApiKey = googleApiKey
    }

    // Check if we need to prompt for API key
    const needsApiKeyPrompt = model.requiresApiKey && !targetApiKey

    if (needsApiKeyPrompt) {
      setPendingModel(modelId)
      setTempApiKey("")
      setShowApiKeyDialog(true)
    } else {
      handleSetSelectedModel(modelId)
    }
  }

  const handleApiKeySubmit = () => {
    if (!tempApiKey.trim()) return

    const modelToUse = pendingModel || selectedModel
    const targetModel = models.find((m) => m.id === modelToUse)
    if (!targetModel) return

    // Save the API key for the appropriate provider
    setApiKeyForProvider(targetModel.provider, tempApiKey.trim())

    handleSetSelectedModel(modelToUse)
    setShowApiKeyDialog(false)
    setPendingModel("")
    setTempApiKey("")

    const providerName =
      targetModel.provider === "openai"
        ? "OpenAI"
        : targetModel.provider === "google"
          ? "Google"
          : targetModel.provider === "groq"
            ? "Groq"
            : "Anthropic"
    toast.success(`${providerName} API key ${apiKey ? "updated" : "saved"}`)
  }

  const removeApiKey = () => {
    if (!currentModel) return
    // Show confirmation dialog
    setShowRemoveDialog(true)
  }

  const confirmRemoveApiKey = () => {
    if (!currentModel) return

    const providerName =
      currentModel.provider === "openai"
        ? "OpenAI"
        : currentModel.provider === "google"
          ? "Google"
          : currentModel.provider === "groq"
            ? "Groq"
            : "Anthropic"

    setApiKeyForProvider(currentModel.provider, null)

    // For models that require API keys (no free option), switch to default free model
    if (currentModel.requiresApiKey) {
      handleSetSelectedModel(defaultFreeModel.id)
      toast.success(`${providerName} API key removed. Switched to ${defaultFreeModel.name}.`)
    } else {
      // For Google models with optional keys, just remove the key and use community key
      toast.success(`${providerName} API key removed. Using free community key.`)
    }

    setTempApiKey("")
    setShowRemoveDialog(false)
  }

  return (
    <>
      <div className="flex flex-1 items-center justify-between">
        <div className="flex-1 min-w-0">
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="h-7 border-0 shadow-none px-2 bg-transparent hover:bg-accent/50 transition-colors focus:ring-0 text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {currentModel?.icon}
                <span className="truncate">{currentModel?.name || "Select model"}</span>
              </div>
            </SelectTrigger>
            <SelectContent
              align="start"
              className="min-w-[300px] md:min-w-[300px] w-[90vw] md:w-auto max-w-[calc(100vw-2rem)]"
            >
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2">
                  <div className="flex items-center gap-2 w-full">
                    {model.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{model.name}</span>
                        <Badge variant={model.requiresApiKey ? "secondary" : "default"} className="text-xs shrink-0">
                          {model.badge}
                        </Badge>
                      </div>
                      {model.description && <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>}
                    </div>
                  </div>
                </SelectItem>
              ))}
              <div className="text-center text-[10px] text-muted-foreground p-0.5 pt-1.5 border-t mt-0.5 border-t-muted">
                Logos may be trademarked and remain the property of their respective owner.
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Show API key UI if model accepts keys (required or optional) */}
        {(currentModel?.requiresApiKey || currentModel?.supportsOptionalApiKey) && (
          <>
            {apiKey ? (
              // API key is set - show badge with edit and remove buttons
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-xs h-6">
                  <Key className="h-3 w-3 mr-1" />
                  {currentModel?.supportsOptionalApiKey ? "My Key" : "Set"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPendingModel(selectedModel)
                    setTempApiKey("")
                    setShowApiKeyDialog(true)
                  }}
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  title="Edit API key"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeApiKey}
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive"
                  title="Remove API key"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              // No key set - show add button
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingModel(selectedModel)
                  setTempApiKey("")
                  setShowApiKeyDialog(true)
                }}
                className="h-6 px-2 text-xs ml-2"
              >
                <Key className="h-3 w-3 mr-1" />
                {currentModel?.supportsOptionalApiKey ? "Add Key (Optional)" : "Add Key"}
              </Button>
            )}
          </>
        )}
      </div>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {apiKey
                ? "Update API Key"
                : pendingModel
                  ? models.find((m) => m.id === pendingModel)?.supportsOptionalApiKey
                    ? "Add API Key (Optional)"
                    : "API Key Required"
                  : "API Key"}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                const providerName =
                  targetModel?.provider === "openai"
                    ? "OpenAI"
                    : targetModel?.provider === "google"
                      ? "Google"
                      : targetModel?.provider === "groq"
                        ? "Groq"
                        : "Anthropic"
                return apiKey
                  ? `Update your ${providerName} API key to continue using this model.`
                  : targetModel?.supportsOptionalApiKey
                    ? `Optionally provide your own ${providerName} API key to unlock higher rate limits. You can also skip this and use the free community key.`
                    : `To use ${providerName} models, you need to provide your own API key.`
              })()}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                return targetModel?.supportsOptionalApiKey ? "About API Keys" : "Important Information"
              })()}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              {(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                if (targetModel?.supportsOptionalApiKey) {
                  return (
                    <>
                      <p>
                        <strong>You can use this model for free with the community key.</strong> However, if you provide
                        your own API key:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>You will have higher rate limits</li>
                        <li>You are responsible for the usage and security of your API key</li>
                        <li>
                          Data you submit will be processed by BioContextAI, its subcontractors, and the selected AI
                          provider
                        </li>
                        <li>Standard API usage charges will apply to your account</li>
                        <li>Your API key is stored temporarily in your browser session and processed on our servers</li>
                        <li>
                          We recommend using a dedicated API key and configuring a usage limit in your provider account
                          to avoid unexpected charges
                        </li>
                      </ul>
                    </>
                  )
                } else {
                  return (
                    <>
                      <p>By providing your API key, you understand that:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>You are responsible for the usage and security of your API key</li>
                        <li>
                          Data you submit will be processed by BioContextAI, its subcontractors, and the selected AI
                          provider
                        </li>
                        <li>Standard API usage charges will apply to your account</li>
                        <li>Your API key is stored temporarily in your browser session and processed on our servers</li>
                        <li>
                          We highly recommend using a dedicated API key for this session and to configure a usage limit
                          in your provider account to avoid unexpected charges
                        </li>
                      </ul>
                    </>
                  )
                }
              })()}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="api-key">
              {(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                return targetModel?.provider === "openai"
                  ? "OpenAI"
                  : targetModel?.provider === "google"
                    ? "Google"
                    : targetModel?.provider === "groq"
                      ? "Groq"
                      : "Anthropic"
              })()}{" "}
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder={(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                return targetModel?.provider === "openai"
                  ? "sk-..."
                  : targetModel?.provider === "google"
                    ? "AIza..."
                    : targetModel?.provider === "groq"
                      ? "gsk_..."
                      : "sk-ant-..."
              })()}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Your API key will be stored in your browser&apos;s local storage.
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse md:flex-row gap-2">
            {apiKey ? (
              // When editing an existing key, show Remove button
              <Button
                variant="destructive"
                onClick={() => {
                  setShowApiKeyDialog(false)
                  setPendingModel("")
                  setTempApiKey("")
                  removeApiKey()
                }}
              >
                Remove API Key
              </Button>
            ) : (
              // When adding a new key, show Cancel button
              <Button
                variant="outline"
                onClick={() => {
                  setShowApiKeyDialog(false)
                  setPendingModel("")
                  setTempApiKey("")
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                if (targetModel?.supportsOptionalApiKey && !tempApiKey.trim()) {
                  // For optional keys, just switch the model without API key
                  handleSetSelectedModel(pendingModel || selectedModel)
                  setShowApiKeyDialog(false)
                  setPendingModel("")
                  setTempApiKey("")
                } else {
                  handleApiKeySubmit()
                }
              }}
              disabled={(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                return targetModel?.requiresApiKey && !tempApiKey.trim()
              })()}
            >
              {apiKey
                ? "Update API Key"
                : `Use ${(() => {
                    const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                    return targetModel?.provider === "openai"
                      ? "OpenAI"
                      : targetModel?.provider === "google"
                        ? "Google"
                        : targetModel?.provider === "groq"
                          ? "Groq"
                          : "Anthropic"
                  })()} ${(() => {
                    const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                    return targetModel?.supportsOptionalApiKey ? "API Key" : "Model"
                  })()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove API Key Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentModel?.supportsOptionalApiKey ? (
                <>
                  Are you sure you want to remove your{" "}
                  {currentModel.provider === "openai"
                    ? "OpenAI"
                    : currentModel.provider === "google"
                      ? "Google"
                      : currentModel.provider === "groq"
                        ? "Groq"
                        : "Anthropic"}{" "}
                  API key? You&apos;ll switch back to using the free community key.
                </>
              ) : (
                <>
                  Are you sure you want to remove your{" "}
                  {currentModel?.provider === "openai"
                    ? "OpenAI"
                    : currentModel?.provider === "google"
                      ? "Google"
                      : currentModel?.provider === "groq"
                        ? "Groq"
                        : "Anthropic"}{" "}
                  API key? You&apos;ll be switched to {defaultFreeModel.name}.
                  {googleApiKey && currentModel?.provider !== "google" && (
                    <span className="block mt-2 text-xs">
                      Note: If you have a Google API key set, it will be used for {defaultFreeModel.name}.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveApiKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove API Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
