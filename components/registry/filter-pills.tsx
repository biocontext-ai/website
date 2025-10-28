"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Settings, Wifi, X } from "lucide-react"

interface FilterPillsProps {
  hasInstallation: boolean
  isRemote: boolean
  onToggleInstallation: () => void
  onToggleRemote: () => void
}

export default function FilterPills({
  hasInstallation,
  isRemote,
  onToggleInstallation,
  onToggleRemote,
}: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">Filters:</span>

      <Badge
        variant={hasInstallation ? "default" : "outline"}
        className={cn("cursor-pointer gap-1.5 transition-all", hasInstallation ? "pr-1.5" : "hover:bg-accent")}
        onClick={onToggleInstallation}
      >
        <Settings className="w-3 h-3" />
        <span>mcp.json</span>
        {hasInstallation && <X className="w-3 h-3 ml-0.5 hover:bg-primary-foreground/20 rounded-full" />}
      </Badge>

      <Badge
        variant={isRemote ? "default" : "outline"}
        className={cn("cursor-pointer gap-1.5 transition-all", isRemote ? "pr-1.5" : "hover:bg-accent")}
        onClick={onToggleRemote}
      >
        <Wifi className="w-3 h-3" />
        <span>Remote</span>
        {isRemote && <X className="w-3 h-3 ml-0.5 hover:bg-primary-foreground/20 rounded-full" />}
      </Badge>

      {(hasInstallation || isRemote) && (
        <button
          onClick={() => {
            if (hasInstallation) onToggleInstallation()
            if (isRemote) onToggleRemote()
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
