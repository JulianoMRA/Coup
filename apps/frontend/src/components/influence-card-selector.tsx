"use client"

import type { Card } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"

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
    <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border flex flex-col gap-2">
      <p className="text-sm font-semibold text-center">Escolha uma carta para revelar:</p>
      {myHand.map((card, originalIndex) => {
        if (card.revealed) return null
        return (
          <Button
            key={originalIndex}
            variant="destructive"
            className="w-full min-h-[44px]"
            aria-label={`Perder ${card.type}`}
            onClick={() =>
              socket.emit("GAME_ACTION", roomId, {
                type: "LOSE_INFLUENCE",
                playerId,
                cardIndex: originalIndex,
              })
            }
          >
            {card.type} — Perder esta
          </Button>
        )
      })}
    </div>
  )
}
