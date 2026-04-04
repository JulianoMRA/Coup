"use client"

import { socket } from "@/lib/socket"
import { GamePhase } from "@coup/shared"
import { Button } from "@/components/ui/button"

interface ActionBarProps {
  roomId: string
  playerId: string
  isMyTurn: boolean
  myCoins: number
  phase: GamePhase
  pendingReactions?: Record<string, "WAITING" | "PASSED" | "CHALLENGED" | "BLOCKED"> | null
  onSelectCoupTarget: () => void
}

export function ActionBar({
  roomId,
  playerId,
  isMyTurn,
  myCoins,
  phase,
  pendingReactions,
  onSelectCoupTarget,
}: ActionBarProps) {
  const isActionPhase = phase === GamePhase.AWAITING_ACTION
  const canAct = isMyTurn && isActionPhase
  const forcedCoup = canAct && myCoins >= 10
  const canCoup = myCoins >= 7

  const needsReaction =
    phase === GamePhase.AWAITING_REACTIONS &&
    pendingReactions?.[playerId] === "WAITING"

  function handleIncome() {
    socket.emit("GAME_ACTION", roomId, { type: "INCOME", playerId })
  }

  function handleForeignAid() {
    socket.emit("GAME_ACTION", roomId, { type: "FOREIGN_AID", playerId })
  }

  function handleCoup() {
    onSelectCoupTarget()
  }

  function handlePass() {
    socket.emit("GAME_ACTION", roomId, { type: "PASS", playerId })
  }

  if (needsReaction) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-16 px-6 flex items-center justify-center gap-4 bg-background border-t border-border">
        <p className="text-sm text-muted-foreground">Ajuda Externa declarada —</p>
        <Button variant="secondary" onClick={handlePass}>
          Passar
        </Button>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-16 px-6 flex flex-col items-center justify-center gap-1 bg-background border-t border-border"
      aria-label={!isMyTurn ? "Aguardando sua vez" : undefined}
    >
      {forcedCoup && (
        <p className="text-sm text-muted-foreground text-center">
          Voce deve Golpear (10+ moedas)
        </p>
      )}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          disabled={!canAct || forcedCoup}
          onClick={handleIncome}
        >
          Renda
        </Button>
        <Button
          variant="secondary"
          disabled={!canAct || forcedCoup}
          onClick={handleForeignAid}
        >
          Ajuda Externa
        </Button>
        <Button
          variant="destructive"
          disabled={!canAct || !canCoup}
          onClick={handleCoup}
        >
          Golpe
        </Button>
      </div>
    </div>
  )
}
