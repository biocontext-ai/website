"use client"

import { cn } from "@/lib/utils"
import { toHtml } from "hast-util-to-html"
import "highlight.js/styles/github-dark.css"
import DOMPurify from "isomorphic-dompurify"
import { createLowlight } from "lowlight"
import { Check, Copy } from "lucide-react"
import React from "react"

// Import only essential languages to keep bundle size small
import bash from "highlight.js/lib/languages/bash"
import json from "highlight.js/lib/languages/json"
import python from "highlight.js/lib/languages/python"
import typescript from "highlight.js/lib/languages/typescript"

// DOMPurify configuration for syntax highlighting
// Only allow tags and attributes needed for code highlighting
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["span", "code", "pre", "br"],
  ALLOWED_ATTR: ["class"],
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: false,
}

interface CodeBlockProps {
  value: string
  language?: string
  className?: string
  showCopyButton?: boolean
  editable?: boolean
}

// Create and configure lowlight instance once at module level
const lowlight = createLowlight()

// Register essential languages for README/documentation
lowlight.register("javascript", typescript)
lowlight.register("js", typescript)
lowlight.register("typescript", typescript)
lowlight.register("ts", typescript)
lowlight.register("python", python)
lowlight.register("py", python)
lowlight.register("bash", bash)
lowlight.register("sh", bash)
lowlight.register("shell", bash)
lowlight.register("json", json)
lowlight.register("jsonc", json)

const CodeBlock: React.FC<CodeBlockProps> = ({
  value,
  language = "text",
  className,
  showCopyButton = true,
  editable = false,
}) => {
  const [isCopied, setIsCopied] = React.useState(false)
  const [highlightedCode, setHighlightedCode] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [editableValue, setEditableValue] = React.useState(value)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const highlightCode = () => {
      try {
        if (lowlight.registered(language)) {
          const tree = lowlight.highlight(language, value)
          const html = toHtml(tree, {
            allowDangerousCharacters: true,
            closeSelfClosing: false,
          })
          // Sanitize HTML with DOMPurify before setting state
          const sanitizedHtml = DOMPurify.sanitize(html, SANITIZE_CONFIG)
          setHighlightedCode(sanitizedHtml)
        } else {
          // Fallback for unsupported languages - escape HTML
          const escapedValue = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          setHighlightedCode(escapedValue)
        }
      } catch (error) {
        console.error("Failed to highlight code:", error)
        // Fallback - escape HTML
        const escapedValue = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        setHighlightedCode(escapedValue)
      } finally {
        setIsLoading(false)
      }
    }

    highlightCode()
  }, [value, language])

  const handleCopy = async () => {
    try {
      const textToCopy = editable ? editableValue : value
      await navigator.clipboard.writeText(textToCopy)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  React.useEffect(() => {
    if (editable && textareaRef.current) {
      // Auto-resize textarea to fit content
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [editableValue, editable])

  return (
    <div className={cn("relative group code-block", className)}>
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
      {editable ? (
        <textarea
          ref={textareaRef}
          value={editableValue}
          onChange={(e) => setEditableValue(e.target.value)}
          className="hljs rounded-lg overflow-x-auto p-4 text-sm font-mono leading-relaxed whitespace-pre w-full resize-none bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50"
          spellCheck={false}
        />
      ) : isLoading ? (
        <pre className="hljs rounded-lg overflow-x-auto p-4 whitespace-pre">
          <code className="text-sm font-mono">{value}</code>
        </pre>
      ) : (
        <pre
          className="hljs rounded-lg overflow-x-auto p-4 text-sm font-mono leading-relaxed whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      )}
    </div>
  )
}

export default CodeBlock
