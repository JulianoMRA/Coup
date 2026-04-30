"use client"

import type { PublicPlayerState } from "@coup/shared"
import { socket } from "@/lib/socket"

interface CoupTargetSelectorProps {
  players: PublicPlayerState[]
  myId: string
  roomId: string
  playerId: string
  onCancel: () => void
  actionType?: string
  label?: string
}

export function CoupTargetSelector({
  players,
  myId,
  roomId,
  playerId,
  onCancel,
  actionType = "COUP",
  label = "Golpe de Estado",
}: CoupTargetSelectorProps) {
  const targets = players.filter((p) => !p.eliminated && p.id !== myId)

  function handleSelectTarget(targetId: string) {
    socket.emit("GAME_ACTION", roomId, { type: actionType as "COUP" | "STEAL" | "ASSASSINATE", playerId, targetId })
    onCancel()
  }

  return (
    <div className="action-panel state-enter">
      <div className="action-title">
        Escolha o alvo para <em>{label}</em>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {targets.map((target) => (
          <button
            key={target.id}
            className="btn"
            onClick={() => handleSelectTarget(target.id)}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: "50%",
              background: "oklch(0.22 0.03 60)", border: "1px solid var(--gold)",
              fontFamily: "var(--font-display)", fontSize: 14, color: "var(--gold)",
              marginRight: 8, flexShrink: 0,
            }}>
              {target.name.charAt(0).toUpperCase()}
            </span>
            {target.name}
          </button>
        ))}
        <button className="btn ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
