"use client"

import { useState } from "react"
import type { ClientGameState } from "@coup/shared"
import { PlayerPanel } from "@/components/player-panel"
import { ActionBar } from "@/components/action-bar"
import { GameLog } from "@/components/game-log"
import { ConnectionBadge } from "@/components/connection-badge"
import { Button } from "@/components/ui/button"

interface GameBoardProps {
  game: ClientGameState
  playerId: string
  roomId: string
}

export function GameBoard({ game, playerId, roomId }: GameBoardProps) {
  const [selectingCoupTarget, setSelectingCoupTarget] = useState(false)
  const [showMobileLog, setShowMobileLog] = useState(false)

  const isMyTurn = game.activePlayerId === playerId
  const myPlayer = game.players.find((p) => p.id === playerId)
  const myCoins = myPlayer?.coins ?? 0

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <header className="h-14 px-6 flex items-center justify-between border-b border-border">
        <h1 className="text-[20px] font-semibold">Sala: {roomId}</h1>
        <ConnectionBadge />
      </header>
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        <div className="w-full md:w-72 shrink-0">
          <PlayerPanel
            players={game.players}
            activePlayerId={game.activePlayerId}
            myId={playerId}
          />
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
      <ActionBar
        roomId={roomId}
        playerId={playerId}
        isMyTurn={isMyTurn}
        myCoins={myCoins}
        phase={game.phase}
        onSelectCoupTarget={() => setSelectingCoupTarget(true)}
      />
    </div>
  )
}
