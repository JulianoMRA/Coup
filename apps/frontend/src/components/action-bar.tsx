"use client"

import { socket } from "@/lib/socket"
import { GamePhase } from "@coup/shared"
import type { PublicPlayerState } from "@coup/shared"
import { Coin } from "@/components/ui/coin"

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

  const waitingNames = Object.entries(pendingReactions ?? {})
    .filter(([, status]) => status === "WAITING")
    .map(([id]) => players.find((p) => p.id === id)?.name ?? id)
    .join(", ")

  const activePlayer = players.find((p) => p.id !== playerId)

  function handleIncome() {
    socket.emit("GAME_ACTION", roomId, { type: "INCOME", playerId })
  }

  function handleForeignAid() {
    socket.emit("GAME_ACTION", roomId, { type: "FOREIGN_AID", playerId })
  }

  function handleTax() {
    socket.emit("GAME_ACTION", roomId, { type: "TAX", playerId })
  }

  function handleExchange() {
    socket.emit("GAME_ACTION", roomId, { type: "EXCHANGE", playerId })
  }

  return (
    <div className="action-panel">
      <div className="action-title">
        {isMyTurn
          ? <>É a sua vez — escolha uma <em>ação</em></>
          : <>Aguardando <em>{activePlayer?.name ?? "…"}</em></>}
      </div>

      {waitingNames && (
        <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 13, color: "oklch(0.86 0.03 70 / 0.6)" }}>
          Aguardando: {waitingNames}
        </div>
      )}

      <div className="action-grid">
        <button
          className="action-btn"
          disabled={!canAct || forcedCoup}
          onClick={handleIncome}
        >
          <span className="sc-label">Geral</span>
          <span>Renda</span>
          <span className="desc">+1 moeda</span>
        </button>

        <button
          className="action-btn"
          disabled={!canAct || forcedCoup}
          onClick={handleForeignAid}
        >
          <span className="sc-label">Geral</span>
          <span>Ajuda Externa</span>
          <span className="desc">+2 moedas</span>
        </button>

        <button
          className="action-btn house-assassin"
          disabled={!canAct || myCoins < 7}
          onClick={onSelectCoupTarget}
        >
          <span className="cost"><Coin size={10} /> 7</span>
          <span className="sc-label">Geral</span>
          <span>Golpe</span>
          <span className="desc">elimina influência</span>
        </button>

        <button
          className="action-btn house-duke"
          disabled={!canAct || forcedCoup}
          onClick={handleTax}
        >
          <span className="sc-label">Duque</span>
          <span>Imposto</span>
          <span className="desc">+3 moedas</span>
        </button>

        <button
          className="action-btn house-captain"
          disabled={!canAct || forcedCoup}
          onClick={onSelectStealTarget}
        >
          <span className="sc-label">Capitão</span>
          <span>Roubar</span>
          <span className="desc">tira 2 moedas</span>
        </button>

        <button
          className="action-btn house-assassin"
          disabled={!canAct || forcedCoup || myCoins < 3}
          onClick={onSelectAssassinateTarget}
        >
          <span className="cost"><Coin size={10} /> 3</span>
          <span className="sc-label">Assassino</span>
          <span>Assassinar</span>
          <span className="desc">elimina influência</span>
        </button>

        <button
          className="action-btn house-ambassador"
          disabled={!canAct || forcedCoup}
          onClick={handleExchange}
        >
          <span className="sc-label">Embaixador</span>
          <span>Trocar</span>
          <span className="desc">2 cartas da corte</span>
        </button>
      </div>

      {forcedCoup && (
        <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontStyle: "italic", color: "oklch(0.65 0.18 25)" }}>
          ◆ Você tem 10+ moedas — deve dar um Golpe de Estado.
        </div>
      )}
    </div>
  )
}
