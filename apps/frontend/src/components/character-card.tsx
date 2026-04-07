"use client"

import { Crown, Anchor, Sword, Globe, Gem, Shield } from "lucide-react"
import type { CardType } from "@coup/shared"
import { cn } from "@/lib/utils"

export const CHARACTER_CONFIG: Record<
  string,
  {
    label: string
    colorClass: string
    borderClass: string
    Icon: React.ComponentType<{ className?: string }>
  }
> = {
  DUKE: {
    label: "Duque",
    colorClass: "text-character-duke",
    borderClass: "border-character-duke",
    Icon: Crown,
  },
  CAPTAIN: {
    label: "Capitao",
    colorClass: "text-character-captain",
    borderClass: "border-character-captain",
    Icon: Anchor,
  },
  ASSASSIN: {
    label: "Assassino",
    colorClass: "text-character-assassin",
    borderClass: "border-character-assassin",
    Icon: Sword,
  },
  AMBASSADOR: {
    label: "Embaixador",
    colorClass: "text-character-ambassador",
    borderClass: "border-character-ambassador",
    Icon: Globe,
  },
  CONTESSA: {
    label: "Condessa",
    colorClass: "text-character-countess",
    borderClass: "border-character-countess",
    Icon: Gem,
  },
}

const SIZE_CLASSES = {
  sm: "w-16 h-20 p-1.5",
  md: "w-20 h-28 p-3",
  lg: "w-24 h-32 p-4",
}

interface CharacterCardProps {
  type: CardType | string
  revealed: boolean
  showFace?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CharacterCard({
  type,
  revealed,
  showFace = true,
  size = "md",
  className,
}: CharacterCardProps) {
  const sizeClass = SIZE_CLASSES[size]

  if (!showFace) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border-2",
          "bg-zinc-900 border-zinc-700",
          sizeClass,
          className
        )}
      >
        <Shield className="h-6 w-6 text-zinc-600" />
        <span className="text-xs font-semibold text-zinc-600">?</span>
      </div>
    )
  }

  const config = CHARACTER_CONFIG[type]

  if (!config) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border-2",
          "bg-zinc-900 border-zinc-700",
          sizeClass,
          className
        )}
      >
        <Shield className="h-6 w-6 text-zinc-600" />
        <span className="text-xs font-semibold text-zinc-600">?</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border-2",
        "bg-zinc-900",
        config.borderClass,
        revealed && "opacity-40 grayscale",
        sizeClass,
        className
      )}
    >
      <config.Icon className={cn("h-6 w-6", config.colorClass)} />
      <span className={cn("text-xs font-semibold", config.colorClass)}>
        {config.label}
      </span>
    </div>
  )
}
