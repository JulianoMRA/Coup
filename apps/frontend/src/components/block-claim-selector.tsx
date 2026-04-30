"use client"

import { CardType } from "@coup/shared"
import { socket } from "@/lib/socket"

const CARD_LABELS: Record<string, string> = {
  DUKE: "Duque",
  CONTESSA: "Condessa",
  CAPTAIN: "Capitão",
  AMBASSADOR: "Embaixador",
  ASSASSIN: "Assassino",
}

const CARD_HOUSE: Record<string, string> = {
  DUKE: "house-duke",
  CAPTAIN: "house-captain",
  AMBASSADOR: "house-ambassador",
  CONTESSA: "house-assassin",
  ASSASSIN: "house-assassin",
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
    <div className="reaction-bar" style={{ flexDirection: "column", alignItems: "center" }}>
      <p style={{ fontFamily: "var(--font-sc)", fontSize: 10, letterSpacing: "0.2em", color: "var(--gold)", opacity: 0.85 }}>
        BLOQUEAR COMO
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {validCards.map((card) => (
          <button
            key={card}
            className={`btn ${CARD_HOUSE[card] ?? ""}`}
            onClick={() =>
              socket.emit("GAME_ACTION", roomId, {
                type: "BLOCK",
                playerId,
                claimedCard: card,
              })
            }
          >
            {CARD_LABELS[card] ?? card}
          </button>
        ))}
        <button className="btn ghost" onClick={onCancel}>
          Voltar
        </button>
      </div>
    </div>
  )
}
