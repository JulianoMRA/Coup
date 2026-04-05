"use client"

import { CardType } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"

const CARD_LABELS: Record<string, string> = {
  DUKE: "Duque",
  CONTESSA: "Condessa",
  CAPTAIN: "Capitao",
  AMBASSADOR: "Embaixador",
  ASSASSIN: "Assassino",
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
      {validCards.map((card) => (
        <Button
          key={card}
          variant="outline"
          onClick={() =>
            socket.emit("GAME_ACTION", roomId, {
              type: "BLOCK",
              playerId,
              claimedCard: card,
            })
          }
        >
          {CARD_LABELS[card] ?? card}
        </Button>
      ))}
      <Button variant="ghost" onClick={onCancel}>
        Voltar
      </Button>
    </div>
  )
}
