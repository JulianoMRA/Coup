"use client"

import { useState } from "react"
import type { PendingAction, PublicPlayerState } from "@coup/shared"
import { CardType } from "@coup/shared"
import { socket } from "@/lib/socket"
import { BlockClaimSelector } from "./block-claim-selector"

const ACTION_LABELS: Record<string, string> = {
  FOREIGN_AID: "Ajuda Externa",
  TAX: "Imposto",
  STEAL: "Roubo",
  ASSASSINATE: "Assassinato",
  EXCHANGE: "Troca de Cartas",
}

const BLOCKER_RULES: Record<string, { anyPlayer: boolean; cards: CardType[] }> = {
  FOREIGN_AID: { anyPlayer: true, cards: [CardType.DUKE] },
  STEAL: { anyPlayer: false, cards: [CardType.CAPTAIN, CardType.AMBASSADOR] },
  ASSASSINATE: { anyPlayer: false, cards: [CardType.CONTESSA] },
}

const CHALLENGEABLE_ACTIONS = new Set(["TAX", "STEAL", "ASSASSINATE", "EXCHANGE"])

interface ReactionBarProps {
  pendingAction: PendingAction
  players: PublicPlayerState[]
  playerId: string
  roomId: string
}

export function ReactionBar({
  pendingAction,
  players,
  playerId,
  roomId,
}: ReactionBarProps) {
  const [showBlockClaim, setShowBlockClaim] = useState(false)

  const canChallenge = CHALLENGEABLE_ACTIONS.has(pendingAction.type)

  const rule = BLOCKER_RULES[pendingAction.type]
  const isTarget = pendingAction.targetId === playerId
  const blockResult =
    rule && (rule.anyPlayer || isTarget)
      ? { canBlock: true, cards: rule.cards }
      : { canBlock: false, cards: [] as CardType[] }

  const myReactionStatus = pendingAction.pendingReactions[playerId]

  const waiting = Object.entries(pendingAction.pendingReactions)
    .filter(([id, status]) => status === "WAITING" && id !== pendingAction.playerId)
    .map(([id]) => players.find((p) => p.id === id)?.name ?? id)

  const actorName =
    players.find((p) => p.id === pendingAction.playerId)?.name ?? pendingAction.playerId

  const targetName = pendingAction.targetId
    ? players.find((p) => p.id === pendingAction.targetId)?.name
    : null

  const actionLabel = ACTION_LABELS[pendingAction.type] ?? pendingAction.type

  function handlePass() {
    socket.emit("GAME_ACTION", roomId, { type: "PASS", playerId })
  }

  function handleChallenge() {
    socket.emit("GAME_ACTION", roomId, { type: "CHALLENGE", playerId })
  }

  const isActor = pendingAction.playerId === playerId
  const alreadyReacted = myReactionStatus !== "WAITING"

  if (isActor || alreadyReacted) {
    return (
      <div className="action-panel state-enter">
        <div className="action-title">
          <em>{actorName}</em> declarou <em>{actionLabel}</em>
          {targetName ? <> contra <em>{targetName}</em></> : null}
        </div>
        <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontStyle: "italic", color: "oklch(0.86 0.03 70 / 0.75)", fontSize: 14 }}>
          {waiting.length
            ? `Aguardando reação de ${waiting.join(", ")}…`
            : "Resolvendo…"}
        </div>
      </div>
    )
  }

  return (
    <div className="action-panel state-enter">
      <div className="action-title">
        <em>{actorName}</em> declarou <em>{actionLabel}</em>
        {targetName ? <> contra <em>{targetName}</em></> : null}
      </div>

      {showBlockClaim ? (
        <BlockClaimSelector
          validCards={blockResult.cards}
          roomId={roomId}
          playerId={playerId}
          onCancel={() => setShowBlockClaim(false)}
        />
      ) : (
        <div className="reaction-bar">
          <button className="btn" onClick={handlePass}>
            Permitir
          </button>
          {canChallenge && (
            <button className="btn danger" onClick={handleChallenge}>
              ⚔ Contestar
            </button>
          )}
          {blockResult.canBlock && (
            <button className="btn" onClick={() => setShowBlockClaim(true)}>
              Bloquear
            </button>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontStyle: "italic", color: "oklch(0.86 0.03 70 / 0.6)", fontSize: 13 }}>
        Bluff permitido. Se contestado e mentiu, perde uma influência.
      </div>
    </div>
  )
}
