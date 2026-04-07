"use client"

import type { PublicPlayerState } from "@coup/shared"
import { Trophy } from "lucide-react"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md">
      <Card className="w-80 text-center p-8 bg-zinc-900 border-zinc-700 shadow-2xl">
        <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
        <h2 className="text-[28px] font-semibold">Fim de Jogo</h2>
        <p className="text-sm text-muted-foreground mt-2">Vencedor!</p>
        <p className="text-[20px] font-semibold mt-4 text-zinc-100">{winner?.name ?? "Desconhecido"}</p>
        <Button
          variant="default"
          className="w-full mt-6 min-h-[44px]"
          onClick={() => socket.emit("REMATCH", roomId)}
        >
          Revanche
        </Button>
      </Card>
    </div>
  )
}
