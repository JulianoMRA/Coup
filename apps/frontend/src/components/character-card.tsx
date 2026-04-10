"use client"

import { Crown, Anchor, Sword, Globe, Gem, Swords } from "lucide-react"
import type { CardType } from "@coup/shared"
import { cn } from "@/lib/utils"

export const CHARACTER_CONFIG: Record<string, {
  label: string
  initial: string
  colorClass: string
  borderClass: string
  faceBg: string
  faceColor: string
  accentBg: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  DUKE: {
    label: "Duque",
    initial: "D",
    colorClass: "text-character-duke",
    borderClass: "border-character-duke",
    faceBg: "bg-violet-50",
    faceColor: "text-violet-800",
    accentBg: "bg-violet-600",
    Icon: Crown,
  },
  CAPTAIN: {
    label: "Capitao",
    initial: "C",
    colorClass: "text-character-captain",
    borderClass: "border-character-captain",
    faceBg: "bg-blue-50",
    faceColor: "text-blue-800",
    accentBg: "bg-blue-600",
    Icon: Anchor,
  },
  ASSASSIN: {
    label: "Assassino",
    initial: "A",
    colorClass: "text-character-assassin",
    borderClass: "border-character-assassin",
    faceBg: "bg-red-50",
    faceColor: "text-red-800",
    accentBg: "bg-red-700",
    Icon: Sword,
  },
  AMBASSADOR: {
    label: "Embaixador",
    initial: "E",
    colorClass: "text-character-ambassador",
    borderClass: "border-character-ambassador",
    faceBg: "bg-emerald-50",
    faceColor: "text-emerald-800",
    accentBg: "bg-emerald-700",
    Icon: Globe,
  },
  CONTESSA: {
    label: "Condessa",
    initial: "C",
    colorClass: "text-character-countess",
    borderClass: "border-character-countess",
    faceBg: "bg-rose-50",
    faceColor: "text-rose-800",
    accentBg: "bg-rose-600",
    Icon: Gem,
  },
}

// Outer card dimensions — widths are fixed to satisfy tests (w-16 / w-20 / w-24)
const SIZE_CLASSES: Record<string, string> = {
  sm: "w-16 h-24",
  md: "w-20 h-28",
  lg: "w-24 h-[8.5rem]",
}

const ACCENT_BAR: Record<string, string> = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2",
}

const CENTER_ICON: Record<string, string> = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
}

const NAME_TEXT: Record<string, string> = {
  sm: "text-[7px]",
  md: "text-[9px]",
  lg: "text-[11px]",
}

const INDEX_TEXT: Record<string, string> = {
  sm: "text-[8px]",
  md: "text-[9px]",
  lg: "text-[11px]",
}

const INDEX_ICON: Record<string, string> = {
  sm: "h-[9px] w-[9px]",
  md: "h-[11px] w-[11px]",
  lg: "h-[13px] w-[13px]",
}

const BACK_ICON: Record<string, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
}

const BACK_TEXT: Record<string, string> = {
  sm: "text-[8px]",
  md: "text-[9px]",
  lg: "text-[10px]",
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
  if (!showFace || !CHARACTER_CONFIG[type as string]) {
    return (
      <div
        className={cn(
          "relative select-none shrink-0 rounded-[3px] overflow-hidden flex flex-col",
          "bg-zinc-800 border-2 border-zinc-600 shadow-lg shadow-black/40",
          SIZE_CLASSES[size],
          className
        )}
      >
        {/* Argyle / diamond back pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #888 0, #888 1px, transparent 0, transparent 50%), " +
              "repeating-linear-gradient(-45deg, #888 0, #888 1px, transparent 0, transparent 50%)",
            backgroundSize: "6px 6px",
          }}
        />
        {/* Inner border ornament */}
        <div className="absolute inset-[4px] rounded-[1px] border border-zinc-500/30 pointer-events-none" />
        <div className="flex-1 flex flex-col items-center justify-center gap-1 relative z-10">
          <Swords className={cn("text-zinc-500", BACK_ICON[size])} />
          <span className={cn("font-cinzel font-bold tracking-widest text-zinc-500", BACK_TEXT[size])}>
            ?
          </span>
        </div>
      </div>
    )
  }

  const config = CHARACTER_CONFIG[type as string]

  return (
    <div
      className={cn(
        "relative select-none shrink-0 rounded-[3px] overflow-hidden flex flex-col",
        "border-2 shadow-md shadow-black/50",
        config.faceBg,
        config.borderClass,
        revealed && "opacity-40 grayscale",
        SIZE_CLASSES[size],
        className
      )}
    >
      {/* Inner ornament border */}
      <div
        className={cn(
          "absolute inset-[4px] rounded-[1px] border border-opacity-20 pointer-events-none z-10",
          config.borderClass
        )}
      />

      {/* Top accent bar */}
      <div className={cn("shrink-0", ACCENT_BAR[size], config.accentBg)} />

      {/* Top-left corner index */}
      <div className="absolute top-[6px] left-[5px] flex flex-col items-center gap-[1px] z-20">
        <span className={cn("font-cinzel font-bold leading-none", config.faceColor, INDEX_TEXT[size])}>
          {config.initial}
        </span>
        <config.Icon className={cn("shrink-0", config.faceColor, INDEX_ICON[size])} />
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-1">
        <config.Icon className={cn(config.faceColor, CENTER_ICON[size])} />
        <span
          className={cn(
            "font-cinzel font-semibold text-center leading-tight tracking-tight",
            config.faceColor,
            NAME_TEXT[size]
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Bottom-right corner index (rotated 180°) */}
      <div className="absolute bottom-[6px] right-[5px] flex flex-col items-center gap-[1px] rotate-180 z-20">
        <span className={cn("font-cinzel font-bold leading-none", config.faceColor, INDEX_TEXT[size])}>
          {config.initial}
        </span>
        <config.Icon className={cn("shrink-0", config.faceColor, INDEX_ICON[size])} />
      </div>

      {/* Bottom accent bar */}
      <div className={cn("shrink-0", ACCENT_BAR[size], config.accentBg)} />

      {/* Death overlay — diagonal cross */}
      {revealed && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="absolute w-[140%] h-[2px] bg-red-600/60 rotate-45 origin-center" />
          <div className="absolute w-[140%] h-[2px] bg-red-600/60 -rotate-45 origin-center" />
        </div>
      )}
    </div>
  )
}
