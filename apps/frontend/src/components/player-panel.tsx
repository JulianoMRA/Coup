"use client"

import type { PublicPlayerState } from "@coup/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerSeat } from "@/components/player-seat"

interface PlayerPanelProps {
  players: PublicPlayerState[]
  activePlayerId: string
  myId: string
  disconnectedPlayers?: string[]
}

export function PlayerPanel({ players, activePlayerId, myId, disconnectedPlayers = [] }: PlayerPanelProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-zinc-300">Jogadores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.map((player) => (
          <PlayerSeat
            key={player.id}
            player={player}
            isActive={player.id === activePlayerId}
            isMe={player.id === myId}
            isDisconnected={disconnectedPlayers.includes(player.id)}
          />
        ))}
      </CardContent>
    </Card>
  )
}
