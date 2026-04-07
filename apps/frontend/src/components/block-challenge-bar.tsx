"use client"

import type { PendingAction, PublicPlayerState } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"

const CARD_LABELS: Record<string, string> = {
  DUKE: "Duque",
  CONTESSA: "Condessa",
  CAPTAIN: "Capitao",
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
    <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 flex flex-col gap-2">
      <p className="text-sm font-semibold text-zinc-200 text-center">
        {blockerName} bloqueou com {cardLabel} — Contestar?
      </p>
      {isActivePlayer && myReactionStatus === "WAITING" ? (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            className="border border-destructive/50 text-destructive hover:bg-destructive/10 min-h-[44px]"
            onClick={handleChallengeBlock}
          >
            Contestar bloco
          </Button>
          <Button
            variant="ghost"
            className="border border-zinc-700 text-zinc-400 hover:bg-zinc-800 min-h-[44px]"
            onClick={handleAcceptBlock}
          >
            Aceitar bloco
          </Button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 text-center">
          Aguardando {activePlayerName} decidir
        </p>
      )}
    </div>
  )
}
