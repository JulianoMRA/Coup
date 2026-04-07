"use client"

import { Crown, Anchor, Sword, Globe, Coins as CoinsIcon } from "lucide-react"
import { socket } from "@/lib/socket"
import { GamePhase } from "@coup/shared"
import type { PublicPlayerState } from "@coup/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ActionBarProps {
  roomId: string
  playerId: string
  isMyTurn: boolean
  myCoins: number
  phase: GamePhase
  pendingReactions?: Record<string, "WAITING" | "PASSED" | "CHALLENGED" | "BLOCKED"> | null
  players: PublicPlayerState[]
  onSelectCoupTarget: () => void
  onSelectStealTarget: () => void
  onSelectAssassinateTarget: () => void
}

export function ActionBar({
  roomId,
  playerId,
  isMyTurn,
  myCoins,
  phase,
  pendingReactions,
  players,
  onSelectCoupTarget,
  onSelectStealTarget,
  onSelectAssassinateTarget,
}: ActionBarProps) {
  const isActionPhase = phase === GamePhase.AWAITING_ACTION
  const canAct = isMyTurn && isActionPhase
  const forcedCoup = canAct && myCoins >= 10
  const canCoup = myCoins >= 7

  const waitingNames = Object.entries(pendingReactions ?? {})
    .filter(([, status]) => status === "WAITING")
    .map(([id]) => players.find((p) => p.id === id)?.name ?? id)
    .join(", ")

  function handleIncome() {
    socket.emit("GAME_ACTION", roomId, { type: "INCOME", playerId })
  }

  function handleForeignAid() {
    socket.emit("GAME_ACTION", roomId, { type: "FOREIGN_AID", playerId })
  }

  function handleCoup() {
    onSelectCoupTarget()
  }

  function handleTax() {
    socket.emit("GAME_ACTION", roomId, { type: "TAX", playerId })
  }

  function handleSteal() {
    onSelectStealTarget()
  }

  function handleAssassinate() {
    onSelectAssassinateTarget()
  }

  function handleExchange() {
    socket.emit("GAME_ACTION", roomId, { type: "EXCHANGE", playerId })
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-auto py-3 px-6 flex flex-col items-center justify-center gap-2 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800"
      aria-label={!isMyTurn ? "Aguardando sua vez" : undefined}
    >
      {forcedCoup && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md px-3 py-1.5">
          <p className="text-sm text-destructive font-medium text-center">
            Voce deve Golpear (10+ moedas)
          </p>
        </div>
      )}
      {waitingNames && (
        <p className="text-xs text-zinc-500 text-center">
          Aguardando: {waitingNames}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 w-full max-w-lg mx-auto">
        <Button
          variant="ghost"
          className={cn(
            "min-h-[44px] border border-zinc-700 hover:bg-zinc-800",
            (!canAct || forcedCoup) && "opacity-40"
          )}
          disabled={!canAct || forcedCoup}
          onClick={handleIncome}
        >
          <CoinsIcon className="h-4 w-4 mr-1" />
          Renda
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "min-h-[44px] border border-zinc-700 hover:bg-zinc-800",
            (!canAct || forcedCoup) && "opacity-40"
          )}
          disabled={!canAct || forcedCoup}
          onClick={handleForeignAid}
        >
          Ajuda Externa
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "min-h-[44px] border border-destructive/60 text-destructive hover:bg-destructive/10",
            (!canAct || !canCoup) && "opacity-40"
          )}
          disabled={!canAct || !canCoup}
          onClick={handleCoup}
        >
          Golpe
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-lg mx-auto">
        <Button
          variant="ghost"
          className={cn(
            "min-h-[44px] gap-1.5 border border-character-duke/50 text-character-duke hover:bg-character-duke/10",
            (!canAct || forcedCoup) && "opacity-40"
          )}
          disabled={!canAct || forcedCoup}
          onClick={handleTax}
        >
          <Crown className="h-4 w-4" />
          Imposto
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "min-h-[44px] gap-1.5 border border-character-captain/50 text-character-captain hover:bg-character-captain/10",
            (!canAct || forcedCoup) && "opacity-40"
          )}
          disabled={!canAct || forcedCoup}
          onClick={handleSteal}
        >
          <Anchor className="h-4 w-4" />
          Roubar
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "min-h-[44px] gap-1.5 border border-character-assassin/50 text-character-assassin hover:bg-character-assassin/10",
            (!canAct || forcedCoup || myCoins < 3) && "opacity-40"
          )}
          disabled={!canAct || forcedCoup || myCoins < 3}
          onClick={handleAssassinate}
        >
          <Sword className="h-4 w-4" />
          Assassinar
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "min-h-[44px] gap-1.5 border border-character-ambassador/50 text-character-ambassador hover:bg-character-ambassador/10",
            (!canAct || forcedCoup) && "opacity-40"
          )}
          disabled={!canAct || forcedCoup}
          onClick={handleExchange}
        >
          <Globe className="h-4 w-4" />
          Embaixador
        </Button>
      </div>
    </div>
  )
}
