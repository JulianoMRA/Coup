"use client"

import type { Card } from "@coup/shared"
import { socket } from "@/lib/socket"
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
  const liveCards = myHand.map((c, i) => ({ ...c, idx: i })).filter((c) => !c.revealed)

  return (
    <div className="dramatic-backdrop">
      <div className="dramatic-panel">
        <div className="eyebrow" style={{ color: "oklch(0.65 0.18 25)" }}>◆ Influência Perdida ◆</div>
        <h2 className="display" style={{ fontSize: 32, margin: "8px 0 4px", color: "var(--parchment)" }}>
          Escolha quem cai em desgraça
        </h2>
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "oklch(0.86 0.03 70 / 0.7)", fontSize: 15 }}>
          A carta revelada permanece virada para cima. Exilado quem perder as duas.
        </p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 28 }}>
          {liveCards.map((card) => (
            <button
              key={card.idx}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label={`Perder ${card.type}`}
              onClick={() =>
                socket.emit("GAME_ACTION", roomId, {
                  type: "LOSE_INFLUENCE",
                  playerId,
                  cardIndex: card.idx,
                })
              }
            >
              <CharacterCard type={card.type} revealed={false} showFace={true} size="lg" />
            </button>
          ))}
        </div>
        <p className="sc" style={{ fontSize: 10, color: "var(--gold)", marginTop: 26, opacity: 0.7 }}>
          Clique em uma carta para revelá-la
        </p>
      </div>
    </div>
  )
}
