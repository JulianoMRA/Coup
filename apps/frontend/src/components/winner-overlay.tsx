"use client"

import type { PublicPlayerState } from "@coup/shared"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { socket } from "@/lib/socket"

interface WinnerOverlayProps {
  players: PublicPlayerState[]
  roomId: string
}

export function WinnerOverlay({ players, roomId }: WinnerOverlayProps) {
  const winner = players.find((p) => !p.eliminated)

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-80 text-center p-8">
        <h2 className="text-[28px] font-semibold">Fim de Jogo</h2>
        <p className="text-sm text-muted-foreground mt-2">Vencedor!</p>
        <p className="text-[20px] font-semibold mt-4">{winner?.name ?? "Desconhecido"}</p>
        <Button
          variant="default"
          className="w-full mt-6"
          onClick={() => socket.emit("REMATCH", roomId)}
        >
          Revanche
        </Button>
      </Card>
    </div>
  )
}
