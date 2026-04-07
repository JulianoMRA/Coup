"use client"

import type { Card } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { CharacterCard } from "@/components/character-card"

interface InfluenceCardSelectorProps {
  myHand: Card[]
  roomId: string
  playerId: string
}

export function InfluenceCardSelector({
  myHand,
  roomId,
  playerId,
}: InfluenceCardSelectorProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 flex flex-col gap-2">
      <p className="text-sm font-semibold text-center">Escolha uma carta para revelar:</p>
      {myHand.map((card, originalIndex) => {
        if (card.revealed) return null
        return (
          <Button
            key={originalIndex}
            variant="ghost"
            className="w-full min-h-[44px] border border-destructive/40 hover:bg-destructive/10"
            aria-label={`Perder ${card.type}`}
            onClick={() =>
              socket.emit("GAME_ACTION", roomId, {
                type: "LOSE_INFLUENCE",
                playerId,
                cardIndex: originalIndex,
              })
            }
          >
            <CharacterCard type={card.type} revealed={false} showFace={true} size="sm" />
            Perder esta
          </Button>
        )
      })}
    </div>
  )
}
