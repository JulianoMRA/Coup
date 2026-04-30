"use client"

import { useState, useEffect } from "react"
import type { ClientGameState } from "@coup/shared"
import { GamePhase } from "@coup/shared"
import { Crest } from "@/components/ui/crest"
import { PlayerSeat } from "@/components/player-seat"
import { TableCenter } from "@/components/table-center"
import { Chronicle } from "@/components/chronicle"
import { ActionBar } from "@/components/action-bar"
import { CoupTargetSelector } from "@/components/coup-target-selector"
import { InfluenceCardSelector } from "@/components/influence-card-selector"
import { WinnerOverlay } from "@/components/winner-overlay"
import { ReactionBar } from "@/components/reaction-bar"
import { BlockChallengeBar } from "@/components/block-challenge-bar"
import { ExchangeSelector } from "@/components/exchange-selector"
import { computeSeatPositions } from "@/lib/seat-positions"

interface GameBoardProps {
  game: ClientGameState
  playerId: string
  roomId: string
  error?: string | null
}

export function GameBoard({ game, playerId, roomId, error }: GameBoardProps) {
  const [selectingCoupTarget, setSelectingCoupTarget] = useState(false)
  const [selectingStealTarget, setSelectingStealTarget] = useState(false)
  const [selectingAssassinateTarget, setSelectingAssassinateTarget] = useState(false)

  const isMyTurn = game.activePlayerId === playerId
  const myPlayer = game.players.find((p) => p.id === playerId)
  const myCoins = myPlayer?.coins ?? 0
  const aliveCount = game.players.filter((p) => !p.eliminated).length

  const hasUnrevealedCards = game.myHand.some((c) => !c.revealed)
  const needsInfluenceChoice =
    ((game.phase === GamePhase.RESOLVING_CHALLENGE ||
      game.phase === GamePhase.RESOLVING_BLOCK_CHALLENGE) &&
      hasUnrevealedCards &&
      game.pendingAction?.losingPlayerId === playerId) ||
    (game.phase === GamePhase.AWAITING_COUP_TARGET &&
      game.pendingAction?.targetId === playerId)

  const needsExchange =
    game.phase === GamePhase.AWAITING_EXCHANGE &&
    game.pendingAction?.playerId === playerId

  const needsReaction =
    game.phase === GamePhase.AWAITING_REACTIONS &&
    game.pendingAction?.pendingReactions?.[playerId] !== undefined

  const needsBlockChallenge =
    game.phase === GamePhase.AWAITING_BLOCK_CHALLENGE &&
    game.pendingAction?.pendingReactions?.[playerId] !== undefined

  const selectingTarget =
    selectingCoupTarget || selectingStealTarget || selectingAssassinateTarget

  const targetActionType = selectingCoupTarget
    ? "COUP"
    : selectingStealTarget
      ? "STEAL"
      : "ASSASSINATE"
  const targetLabel = selectingCoupTarget
    ? "Selecionar alvo para o Golpe"
    : selectingStealTarget
      ? "Selecionar alvo para Roubar"
      : "Selecionar alvo para Assassinar"

  useEffect(() => {
    if (game.phase !== GamePhase.AWAITING_ACTION) {
      setSelectingCoupTarget(false)
      setSelectingStealTarget(false)
      setSelectingAssassinateTarget(false)
    }
  }, [game.phase])

  const positions = computeSeatPositions(game.players.length, playerId, game.players)
  const disconnected = game.disconnectedPlayers ?? []

  return (
    <div className="felt game-shell">
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar-brand">
          <Crest size={22} />
          <h1>COUP</h1>
        </div>
        <div className="top-bar-meta">
          <span>SALA · {roomId}</span>
          <span className="divider">◆</span>
          <span>{aliveCount} em jogo</span>
        </div>
      </div>

      {/* Stage */}
      <div className="game-stage">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {game.players.map((p, i) => (
            <PlayerSeat
              key={p.id}
              player={p}
              isActive={p.id === game.activePlayerId}
              isMe={p.id === playerId}
              isDisconnected={disconnected.includes(p.id)}
              targeted={game.pendingAction?.targetId === p.id}
              position={positions[i]}
              myHand={p.id === playerId ? game.myHand : undefined}
            />
          ))}
        </div>

        <TableCenter deckCount={game.deckCount} />
        <Chronicle log={game.log} />
      </div>

      {error && (
        <p
          style={{
            padding: "8px 24px",
            color: "var(--wine-deep)",
            fontFamily: "var(--font-display)",
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      {/* Action panel slot */}
      {needsInfluenceChoice ? (
        <InfluenceCardSelector myHand={game.myHand} roomId={roomId} playerId={playerId} />
      ) : needsExchange ? (
        <ExchangeSelector
          myHand={game.myHand}
          exchangeCards={game.pendingAction?.exchangeCards ?? []}
          roomId={roomId}
          playerId={playerId}
        />
      ) : selectingTarget && game.phase === GamePhase.AWAITING_ACTION ? (
        <CoupTargetSelector
          players={game.players}
          myId={playerId}
          roomId={roomId}
          playerId={playerId}
          actionType={targetActionType}
          label={targetLabel}
          onCancel={() => {
            setSelectingCoupTarget(false)
            setSelectingStealTarget(false)
            setSelectingAssassinateTarget(false)
          }}
        />
      ) : needsReaction && game.pendingAction ? (
        <ReactionBar
          pendingAction={game.pendingAction}
          players={game.players}
          playerId={playerId}
          roomId={roomId}
        />
      ) : needsBlockChallenge && game.pendingAction ? (
        <BlockChallengeBar
          pendingAction={game.pendingAction}
          players={game.players}
          playerId={playerId}
          activePlayerId={game.activePlayerId}
          roomId={roomId}
        />
      ) : (
        <ActionBar
          roomId={roomId}
          playerId={playerId}
          isMyTurn={isMyTurn}
          myCoins={myCoins}
          phase={game.phase}
          pendingReactions={game.pendingAction?.pendingReactions}
          players={game.players}
          onSelectCoupTarget={() => setSelectingCoupTarget(true)}
          onSelectStealTarget={() => setSelectingStealTarget(true)}
          onSelectAssassinateTarget={() => setSelectingAssassinateTarget(true)}
        />
      )}

      {game.phase === GamePhase.GAME_OVER && (
        <WinnerOverlay players={game.players} roomId={roomId} />
      )}
    </div>
  )
}
