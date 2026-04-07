"use client"

import { Coins, Shield } from "lucide-react"
import type { PublicPlayerState } from "@coup/shared"
import { cn } from "@/lib/utils"
import { CharacterCard } from "./character-card"
import { Badge } from "@/components/ui/badge"

interface PlayerSeatProps {
  player: PublicPlayerState
  isActive: boolean
  isMe: boolean
  isDisconnected: boolean
}

export function PlayerSeat({ player, isActive, isMe, isDisconnected }: PlayerSeatProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg p-2.5 border border-zinc-800 bg-zinc-900/50",
        isActive && "ring-2 ring-white/80 bg-zinc-800/80",
        player.eliminated && "opacity-40",
        isMe && "border-zinc-600"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            "bg-zinc-700 text-zinc-300",
            isActive && "bg-white/10 text-white"
          )}
        >
          {player.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", player.eliminated && "line-through")}>
            {player.name}
          </p>
          {isMe && (
            <p className="text-xs text-muted-foreground">(voce)</p>
          )}
          {isDisconnected && (
            <p className="text-xs text-muted-foreground">(desconectado)</p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-xs text-yellow-400">
            <Coins className="h-3.5 w-3.5 text-yellow-400" />
            {player.coins}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-zinc-400">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            {player.cardCount}
          </span>
        </div>
      </div>

      {(isActive || player.eliminated) && (
        <div className="flex gap-1 flex-wrap">
          {isActive && (
            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">
              Sua vez
            </Badge>
          )}
          {player.eliminated && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-destructive border-destructive/30"
            >
              Eliminado
            </Badge>
          )}
        </div>
      )}

      {player.revealedCards.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {player.revealedCards.map((card, idx) => (
            <CharacterCard
              key={idx}
              type={card.type}
              revealed={true}
              showFace={true}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  )
}
