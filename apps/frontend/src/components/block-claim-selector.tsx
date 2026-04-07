"use client"

import { CardType } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { CHARACTER_CONFIG } from "@/components/character-card"
import { cn } from "@/lib/utils"

const CARD_LABELS: Record<string, string> = {
  DUKE: "Duque",
  CONTESSA: "Condessa",
  CAPTAIN: "Capitao",
  AMBASSADOR: "Embaixador",
  ASSASSIN: "Assassino",
}

const CARD_HOVER: Record<string, string> = {
  DUKE: "hover:bg-character-duke/10",
  CAPTAIN: "hover:bg-character-captain/10",
  AMBASSADOR: "hover:bg-character-ambassador/10",
  CONTESSA: "hover:bg-character-countess/10",
  ASSASSIN: "hover:bg-character-assassin/10",
}

interface BlockClaimSelectorProps {
  validCards: CardType[]
  roomId: string
  playerId: string
  onCancel: () => void
}

export function BlockClaimSelector({
  validCards,
  roomId,
  playerId,
  onCancel,
}: BlockClaimSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-center">Bloquear como:</p>
      {validCards.map((card) => {
        const config = CHARACTER_CONFIG[card]
        return (
          <Button
            key={card}
            variant="ghost"
            className={cn(
              "min-h-[44px] gap-2 border",
              config?.borderClass + "/50",
              config?.colorClass,
              CARD_HOVER[card]
            )}
            onClick={() =>
              socket.emit("GAME_ACTION", roomId, {
                type: "BLOCK",
                playerId,
                claimedCard: card,
              })
            }
          >
            {config && <config.Icon className="h-4 w-4" />}
            {CARD_LABELS[card] ?? card}
          </Button>
        )
      })}
      <Button variant="ghost" className="text-zinc-500 hover:text-zinc-300" onClick={onCancel}>
        Voltar
      </Button>
    </div>
  )
}
