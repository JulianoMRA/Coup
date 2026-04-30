"use client"

import type { PendingAction, PublicPlayerState } from "@coup/shared"
import { socket } from "@/lib/socket"

const CARD_LABELS: Record<string, string> = {
  DUKE: "Duque",
  CONTESSA: "Condessa",
  CAPTAIN: "Capitão",
  AMBASSADOR: "Embaixador",
  ASSASSIN: "Assassino",
}

interface BlockChallengeBarProps {
  pendingAction: PendingAction
  players: PublicPlayerState[]
  playerId: string
  activePlayerId: string
  roomId: string
}

export function BlockChallengeBar({
  pendingAction,
  players,
  playerId,
  activePlayerId,
  roomId,
}: BlockChallengeBarProps) {
  const blockerName =
    players.find((p) => p.id === pendingAction.blockerId)?.name ??
    pendingAction.blockerId ??
    ""

  const cardLabel =
    CARD_LABELS[pendingAction.blockerClaimedCard ?? ""] ??
    pendingAction.blockerClaimedCard ??
    ""

  const isActivePlayer = activePlayerId === playerId
  const activePlayerName =
    players.find((p) => p.id === activePlayerId)?.name ?? activePlayerId

  const myReactionStatus = pendingAction.pendingReactions[playerId]

  function handleChallengeBlock() {
    socket.emit("GAME_ACTION", roomId, { type: "CHALLENGE", playerId })
  }

  function handleAcceptBlock() {
    socket.emit("GAME_ACTION", roomId, { type: "PASS", playerId })
  }

  return (
    <div className="action-panel state-enter">
      <div className="action-title">
        <em>{blockerName}</em> bloqueou como <em>{cardLabel}</em>
      </div>

      {isActivePlayer && myReactionStatus === "WAITING" ? (
        <div className="reaction-bar">
          <button className="btn danger" onClick={handleChallengeBlock}>
            ⚔ Contestar bloco
          </button>
          <button className="btn ghost" onClick={handleAcceptBlock}>
            Aceitar bloco
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontStyle: "italic", color: "oklch(0.86 0.03 70 / 0.75)", fontSize: 14 }}>
          Aguardando <em style={{ color: "var(--gold)", fontStyle: "normal" }}>{activePlayerName}</em> decidir…
        </div>
      )}
    </div>
  )
}
