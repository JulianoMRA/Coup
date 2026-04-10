"use client"

import { useState, useEffect } from "react"
import type { ClientGameState } from "@coup/shared"
import { GamePhase } from "@coup/shared"
import { PlayerPanel } from "@/components/player-panel"
import { ActionBar } from "@/components/action-bar"
import { GameLog } from "@/components/game-log"
import { ConnectionBadge } from "@/components/connection-badge"
import { CoupTargetSelector } from "@/components/coup-target-selector"
import { InfluenceCardSelector } from "@/components/influence-card-selector"
import { WinnerOverlay } from "@/components/winner-overlay"
import { ReactionBar } from "@/components/reaction-bar"
import { BlockChallengeBar } from "@/components/block-challenge-bar"
import { ExchangeSelector } from "@/components/exchange-selector"
import { CharacterCard } from "@/components/character-card"
import { Button } from "@/components/ui/button"
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers } from "lucide-react"

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
  const [showMobileLog, setShowMobileLog] = useState(false)

  const isMyTurn = game.activePlayerId === playerId
  const myPlayer = game.players.find((p) => p.id === playerId)
  const myCoins = myPlayer?.coins ?? 0

  const hasUnrevealedCards = game.myHand.some(c => !c.revealed)
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

  const selectingTarget = selectingCoupTarget || selectingStealTarget || selectingAssassinateTarget

  const targetActionType = selectingCoupTarget ? "COUP" : selectingStealTarget ? "STEAL" : "ASSASSINATE"
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

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-widest font-cinzel text-zinc-100">COUP</h1>
          <span className="text-zinc-500 text-sm">·</span>
          <span className="text-sm text-zinc-400 font-cinzel tracking-wide">{roomId}</span>
        </div>
        <ConnectionBadge />
      </header>
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
          <PlayerPanel
            players={game.players}
            activePlayerId={game.activePlayerId}
            myId={playerId}
            disconnectedPlayers={game.disconnectedPlayers ?? []}
          />
          <UICard className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-cinzel tracking-wide">Minhas Cartas</CardTitle>
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Layers className="h-3.5 w-3.5" />
                  Baralho: {game.deckCount}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex items-end justify-center min-h-[6.5rem] pb-3 pt-1">
              {game.myHand.map((card, idx) => {
                const total = game.myHand.length
                const center = (total - 1) / 2
                const offset = idx - center
                const rotation = total > 1 ? offset * 14 : 0
                const yShift = total > 1 ? Math.abs(offset) * 6 : 0
                return (
                  <div
                    key={idx}
                    className="transition-all duration-200 hover:-translate-y-2 cursor-default"
                    style={{
                      marginLeft: idx > 0 ? "-10px" : "0",
                      zIndex: idx,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        transform: `rotate(${rotation}deg) translateY(${yShift}px)`,
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
                  </div>
                )
              })}
            </CardContent>
          </UICard>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          {/* Mobile toggle — hidden on md+ */}
          <div className="md:hidden flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowMobileLog(!showMobileLog)}>
              {showMobileLog ? "Ocultar Log" : "Ver Log"}
            </Button>
            {showMobileLog && (
              <div className="h-48 flex flex-col">
                <GameLog log={game.log} />
              </div>
            )}
          </div>
          {/* Desktop always-visible — hidden on mobile */}
          <div className="hidden md:flex flex-col flex-1 min-h-0">
            <GameLog log={game.log} />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-destructive px-4">{error}</p>}
      {needsInfluenceChoice ? (
        <InfluenceCardSelector
          myHand={game.myHand}
          roomId={roomId}
          playerId={playerId}
        />
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
