"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { AlertTriangle, Key, X } from "lucide-react"
import { useState } from "react"
import { useShallow } from "zustand/react/shallow"
import Claude from "../icons/claude"
import Gemini from "../icons/gemini"
import OpenAI from "../icons/openai"

interface ModelOption {
  id: string
  name: string
  provider: "google" | "openai" | "anthropic"
  requiresApiKey: boolean
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
    description: "Free model using the community key (may have stricter rate limit)",
    badge: "Free",
    icon: <Gemini className="h-4 w-4 mr-2" />,
  },
  {
    id: "gemini-2.5-flash-lite-latest",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    requiresApiKey: false,
    description: "Fast and free model using the community key (may be rate-limited)",
    badge: "Free",
    icon: <Gemini className="h-4 w-4 mr-2" />,
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
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    requiresApiKey: true,
    description: "Small and cheap OpenAI model",
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
]

type ModelPickerProps = {
  setMessages: (messages: UIMessage[]) => void
}

export default function ModelPicker({ setMessages }: ModelPickerProps) {
  // Use Zustand store
  const selectedModel = useChatStore(useShallow((state) => state.selectedModel))
  const apiKey = useChatStore(useShallow((state) => state.apiKey))
  const setSelectedModel = useChatStore(useShallow((state) => state.setSelectedModel))
  const setApiKey = useChatStore(useShallow((state) => state.setApiKey))

  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey || "")
  const [pendingModel, setPendingModel] = useState<string>("")

  const currentModel = models.find((m) => m.id === selectedModel)

  const handleSetSelectedModel = (modelId: string) => {
    setSelectedModel(modelId)
  }

  const handleModelChange = (modelId: string) => {
    const model = models.find((m) => m.id === modelId)
    if (!model) return

    // Check if we need to prompt for API key
    const needsApiKeyPrompt =
      model.requiresApiKey &&
      (!apiKey || // No API key exists
        (currentModel && currentModel.provider !== model.provider)) // Switching between different providers

    if (needsApiKeyPrompt) {
      setPendingModel(modelId)
      setShowApiKeyDialog(true)
    } else {
      handleSetSelectedModel(modelId)
    }
  }

  const handleApiKeySubmit = () => {
    if (!tempApiKey.trim()) return

    const modelToUse = pendingModel || selectedModel
    setApiKey(tempApiKey.trim())
    handleSetSelectedModel(modelToUse)
    setShowApiKeyDialog(false)
    setPendingModel("")
  }

  const removeApiKey = () => {
    setApiKey(null)
    setTempApiKey("")
    handleSetSelectedModel("gemini-2.5-flash-latest")
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

        {currentModel?.requiresApiKey && apiKey && (
          <div className="flex items-center gap-1.5 ml-2">
            <Badge variant="outline" className="text-xs h-6">
              <Key className="h-3 w-3 mr-1" />
              Set
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPendingModel(selectedModel)
                setShowApiKeyDialog(true)
              }}
              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Change API key"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeApiKey}
              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Remove API key"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {currentModel?.requiresApiKey && !apiKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPendingModel(selectedModel)
              setShowApiKeyDialog(true)
            }}
            className="h-6 px-2 text-xs ml-2"
          >
            <Key className="h-3 w-3 mr-1" />
            Add Key
          </Button>
        )}
      </div>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {apiKey ? "Update API Key" : "API Key Required"}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                const providerName = targetModel?.provider === "openai" ? "OpenAI" : "Anthropic"
                return apiKey
                  ? `Update your ${providerName} API key to continue using this model.`
                  : `To use ${providerName} models, you need to provide your own API key.`
              })()}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Important Information
            </AlertTitle>
            <AlertDescription className="space-y-2">
              <p>By providing your API key, you understand that:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>You are responsible for the usage and security of your API key</li>
                <li>
                  Data you submit will be processed by BioContextAI, its subcontractors, and the selected AI provider
                </li>
                <li>Standard API usage charges will apply to your account</li>
                <li>Your API key is stored temporarily in your browser session and processed on our servers</li>
                <li>
                  We highly recommend using a dedicated API key for this session and to configure a usage limit in your
                  provider account to avoid unexpected charges
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="api-key">
              {(() => {
                const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                return targetModel?.provider === "openai" ? "OpenAI" : "Anthropic"
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
                return targetModel?.provider === "openai" ? "sk-..." : "sk-ant-..."
              })()}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Your API key will be used for this session only.</p>
          </div>

          <DialogFooter className="flex flex-col-reverse md:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowApiKeyDialog(false)
                setPendingModel("")
                // Reset to original API key value from store when canceling
                setTempApiKey(apiKey || "")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApiKeySubmit} disabled={!tempApiKey.trim()}>
              {apiKey
                ? "Update API Key"
                : `Use ${(() => {
                    const targetModel = pendingModel ? models.find((m) => m.id === pendingModel) : currentModel
                    return targetModel?.provider === "openai" ? "OpenAI" : "Anthropic"
                  })()} Model`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
