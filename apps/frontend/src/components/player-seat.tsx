"use client"

import type { PublicPlayerState, Card } from "@coup/shared"
import { CharacterCard } from "./character-card"
import { Coin } from "@/components/ui/coin"
import type { SeatPosition } from "@/lib/seat-positions"

interface PlayerSeatProps {
  player: PublicPlayerState
  isActive: boolean
  isMe: boolean
  isDisconnected: boolean
  targeted?: boolean
  position?: SeatPosition
  myHand?: Card[]
}

export function PlayerSeat({
  player,
  isActive,
  isMe,
  isDisconnected,
  targeted = false,
  position = { x: "50%", y: "50%" },
  myHand,
}: PlayerSeatProps) {
  const eliminated = player.eliminated
  const classes = [
    "seat",
    isActive && !eliminated ? "active" : "",
    eliminated ? "eliminated" : "",
    isMe ? "is-me" : "",
    targeted ? "targeted" : "",
  ]
    .filter(Boolean)
    .join(" ")

  const handCards = isMe && myHand ? myHand : null
  const fanRotation = (idx: number, total: number) =>
    total > 1 ? (idx - (total - 1) / 2) * 10 : 0

  return (
    <div
      className={classes}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        pointerEvents: "auto",
      }}
    >
      {/* Hand */}
      <div className="seat-hand">
        {handCards
          ? handCards.map((card, i) => (
              <div
                key={i}
                style={{
                  transform: `rotate(${fanRotation(i, handCards.length)}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <CharacterCard
                  type={card.type}
                  revealed={card.revealed}
                  showFace={true}
                  size="sm"
                />
              </div>
            ))
          : Array.from({ length: Math.max(0, player.cardCount) }).map((_, i) => (
              <div
                key={i}
                style={{
                  transform: `rotate(${fanRotation(i, player.cardCount)}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <CharacterCard type="" revealed={false} showFace={false} size="sm" />
              </div>
            ))}
      </div>

      {/* Avatar + name + coins */}
      <div
        className="seat-meta"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
      >
        <div className="seat-avatar">{player.name.charAt(0).toUpperCase()}</div>
        <div className="seat-name">{player.name}</div>
        <div className="seat-coins">
          <Coin size={14} />
          {player.coins}
        </div>
      </div>

      {/* Revealed cards */}
      {player.revealedCards.length > 0 && (
        <div className="seat-revealed">
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

      {/* Badges */}
      {isActive && !eliminated && <div className="seat-badge">SUA VEZ</div>}
      {eliminated && <div className="seat-badge eliminated-badge">EXILADO</div>}
      {isDisconnected && !eliminated && (
        <div className="seat-badge" style={{ top: -10, left: -10, right: "auto" }}>
          AUSENTE
        </div>
      )}

      {targeted && <div className="seat-targeted-ring" />}
    </div>
  )
}
