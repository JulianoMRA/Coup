"use client"

import { useState } from "react"
import type { PendingAction, PublicPlayerState } from "@coup/shared"
import { CardType } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { BlockClaimSelector } from "./block-claim-selector"

const ACTION_LABELS: Record<string, string> = {
  FOREIGN_AID: "Ajuda Externa",
  TAX: "Imposto (Duque)",
  STEAL: "Roubar (Capitao)",
  ASSASSINATE: "Assassinar (Assassino)",
  EXCHANGE: "Embaixador",
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

  const pendingPlayerNames = Object.entries(pendingAction.pendingReactions)
    .filter(([, status]) => status === "WAITING")
    .map(([id]) => players.find((p) => p.id === id)?.name ?? id)
    .join(", ")

  const actorName =
    players.find((p) => p.id === pendingAction.playerId)?.name ?? pendingAction.playerId

  function handlePass() {
    socket.emit("GAME_ACTION", roomId, { type: "PASS", playerId })
  }

  function handleChallenge() {
    socket.emit("GAME_ACTION", roomId, { type: "CHALLENGE", playerId })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border flex flex-col gap-2">
      <p className="text-sm text-muted-foreground text-center">
        {actorName} declarou {ACTION_LABELS[pendingAction.type] ?? pendingAction.type}
      </p>
      {pendingPlayerNames && (
        <p className="text-xs text-muted-foreground text-center">
          Aguardando: {pendingPlayerNames}
        </p>
      )}
      {myReactionStatus !== "WAITING" ? (
        <p className="text-sm text-muted-foreground text-center">
          Voce passou — aguardando os demais
        </p>
      ) : showBlockClaim ? (
        <BlockClaimSelector
          validCards={blockResult.cards}
          roomId={roomId}
          playerId={playerId}
          onCancel={() => setShowBlockClaim(false)}
        />
      ) : (
        <div className="flex items-center justify-center gap-4">
          {canChallenge && (
            <Button variant="destructive" onClick={handleChallenge}>
              Contestar
            </Button>
          )}
          {blockResult.canBlock && (
            <Button variant="outline" onClick={() => setShowBlockClaim(true)}>
              Bloquear
            </Button>
          )}
          <Button variant="secondary" onClick={handlePass}>
            Passar
          </Button>
        </div>
      )}
    </div>
  )
}
