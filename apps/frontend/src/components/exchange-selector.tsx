"use client"

import { useState } from "react"
import type { Card } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { CharacterCard } from "@/components/character-card"

interface ExchangeSelectorProps {
  myHand: Card[]
  exchangeCards: Card[]
  roomId: string
  playerId: string
}

export function ExchangeSelector({
  myHand,
  exchangeCards,
  roomId,
  playerId,
}: ExchangeSelectorProps) {
  const allCards = [...myHand, ...exchangeCards]
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  function toggleCard(index: number) {
    if (allCards[index].revealed) return
    setSelectedIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : prev.length < 2 ? [...prev, index] : prev
    )
  }

  function handleConfirm() {
    if (selectedIndices.length !== 2) return
    socket.emit("GAME_ACTION", roomId, {
      type: "EXCHANGE_CHOOSE",
      playerId,
      keptIndices: selectedIndices as [number, number],
    })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 flex flex-col gap-2">
      <p className="text-sm font-semibold text-center">Escolha 2 cartas para manter:</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {allCards.map((card, index) => {
          if (card.revealed) return null
          const isSelected = selectedIndices.includes(index)
          return (
            <div
              key={index}
              className={`cursor-pointer rounded-lg ${isSelected ? "ring-2 ring-primary" : "opacity-50"}`}
              onClick={() => toggleCard(index)}
            >
              <CharacterCard type={card.type} revealed={false} showFace={true} size="md" />
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        ({selectedIndices.length}/2 selecionadas)
      </p>
      <Button
        variant="default"
        disabled={selectedIndices.length !== 2}
        onClick={handleConfirm}
        className="w-full min-h-[44px]"
      >
        Confirmar Troca ({selectedIndices.length}/2)
      </Button>
    </div>
  )
}
