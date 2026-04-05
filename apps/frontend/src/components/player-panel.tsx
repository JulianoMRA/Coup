"use client"

import type { PublicPlayerState } from "@coup/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PlayerPanelProps {
  players: PublicPlayerState[]
  activePlayerId: string
  myId: string
  disconnectedPlayers?: string[]
}

export function PlayerPanel({ players, activePlayerId, myId, disconnectedPlayers = [] }: PlayerPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Jogadores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.map((player) => {
          const isActive = player.id === activePlayerId
          return (
            <div
              key={player.id}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex flex-col gap-1 p-2 rounded-lg transition-all",
                isActive && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium flex-1 truncate",
                    player.eliminated && "line-through opacity-50"
                  )}
                >
                  {player.name}
                  {player.id === myId && (
                    <span className="ml-1 text-xs text-muted-foreground">(voce)</span>
                  )}
                  {disconnectedPlayers.includes(player.id) && (
                    <span className="ml-1 text-xs text-muted-foreground">(desconectado)</span>
                  )}
                </span>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  <Badge variant="secondary">{player.coins} moedas</Badge>
                  <Badge variant="outline">{player.cardCount} carta(s)</Badge>
                  {isActive && (
                    <Badge className="bg-emerald-500 text-white">Sua vez</Badge>
                  )}
                  {player.eliminated && (
                    <Badge className="bg-destructive/20 text-destructive-foreground">
                      Eliminado
                    </Badge>
                  )}
                </div>
              </div>
              {player.revealedCards.length > 0 && (
                <div className="flex gap-1 flex-wrap ml-10">
                  {player.revealedCards.map((card, idx) => (
                    <Badge key={idx} variant="outline">
                      {card.type}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
