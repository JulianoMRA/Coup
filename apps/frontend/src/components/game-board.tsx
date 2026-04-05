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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="min-h-screen flex flex-col pb-16">
      <header className="h-14 px-6 flex items-center justify-between border-b border-border">
        <h1 className="text-[20px] font-semibold">Sala: {roomId}</h1>
        <ConnectionBadge />
      </header>
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
          <PlayerPanel
            players={game.players}
            activePlayerId={game.activePlayerId}
            myId={playerId}
          />
          <UICard>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Minhas Cartas</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              {game.myHand.map((card, idx) => (
                <Badge
                  key={idx}
                  variant={card.revealed ? "outline" : "secondary"}
                  className="text-sm px-3 py-1"
                >
                  {card.revealed ? `${card.type} (revelada)` : card.type}
                </Badge>
              ))}
            </CardContent>
          </UICard>
        </div>
        <div className="md:hidden">
          <Button
            variant="ghost"
            onClick={() => setShowMobileLog(!showMobileLog)}
          >
            {showMobileLog ? "Ocultar Log" : "Ver Log"}
          </Button>
          {showMobileLog && <GameLog log={game.log} />}
        </div>
        <div className="hidden md:block flex-1">
          <GameLog log={game.log} />
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
          onSelectCoupTarget={() => setSelectingCoupTarget(true)}
          onSelectStealTarget={() => setSelectingStealTarget(true)}
          onSelectAssassinateTarget={() => setSelectingAssassinateTarget(true)}
        />
      )}
      {game.phase === GamePhase.GAME_OVER && (
        <WinnerOverlay players={game.players} />
      )}
    </div>
  )
}
