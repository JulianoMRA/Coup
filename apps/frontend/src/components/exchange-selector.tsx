"use client"

import { useState } from "react"
import type { Card } from "@coup/shared"
import { socket } from "@/lib/socket"
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
  const keepCount = myHand.filter((c) => !c.revealed).length
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  function toggleCard(index: number) {
    if (allCards[index].revealed) return
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : prev.length < keepCount
          ? [...prev, index]
          : prev
    )
  }

  function handleConfirm() {
    if (selectedIndices.length !== keepCount) return
    socket.emit("GAME_ACTION", roomId, {
      type: "EXCHANGE_CHOOSE",
      playerId,
      keptIndices: selectedIndices as [number, number],
    })
  }

  return (
    <div className="dramatic-backdrop">
      <div className="dramatic-panel" style={{ maxWidth: 760 }}>
        <div className="eyebrow">◆ Embaixador ◆</div>
        <h2 className="display" style={{ fontSize: 32, margin: "8px 0 4px", color: "var(--parchment)" }}>
          Troque com o Baralho da Corte
        </h2>
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "oklch(0.86 0.03 70 / 0.7)", fontSize: 15 }}>
          Mantenha {keepCount} {keepCount === 1 ? "carta" : "cartas"}. As outras voltam para o baralho embaralhado.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {allCards.map((card, i) => {
            if (card.revealed) return null
            const picked = selectedIndices.includes(i)
            return (
              <div
                key={i}
                style={{ position: "relative", cursor: "pointer" }}
                onClick={() => toggleCard(i)}
              >
                <CharacterCard type={card.type} revealed={false} showFace={true} size="md" />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 6,
                  border: picked ? "2px solid var(--gold)" : "2px solid transparent",
                  boxShadow: picked ? "0 0 20px oklch(0.76 0.13 82 / 0.4)" : "none",
                  transform: picked ? "translateY(-10px)" : "translateY(0)",
                  transition: "all 0.2s",
                  pointerEvents: "none",
                }} />
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 26, fontFamily: "var(--font-sc)", fontSize: 10, letterSpacing: "0.25em", color: "var(--gold)" }}>
          {selectedIndices.length} / {keepCount} escolhidas
        </div>
        <button
          className="btn primary lg"
          style={{ marginTop: 20 }}
          disabled={selectedIndices.length !== keepCount}
          onClick={handleConfirm}
        >
          Confirmar Troca
        </button>
      </div>
    </div>
  )
}
