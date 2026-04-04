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
  const [showMobileLog, setShowMobileLog] = useState(false)

  const isMyTurn = game.activePlayerId === playerId
  const myPlayer = game.players.find((p) => p.id === playerId)
  const myCoins = myPlayer?.coins ?? 0

  const needsInfluenceChoice =
    game.phase === GamePhase.AWAITING_COUP_TARGET &&
    game.pendingAction?.targetId === playerId

  useEffect(() => {
    if (game.phase !== GamePhase.AWAITING_ACTION) {
      setSelectingCoupTarget(false)
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
      ) : selectingCoupTarget && game.phase === GamePhase.AWAITING_ACTION ? (
        <CoupTargetSelector
          players={game.players}
          myId={playerId}
          roomId={roomId}
          playerId={playerId}
          onCancel={() => setSelectingCoupTarget(false)}
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
        />
      )}
      {game.phase === GamePhase.GAME_OVER && (
        <WinnerOverlay players={game.players} />
      )}
    </div>
  )
}
