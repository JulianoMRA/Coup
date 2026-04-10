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
      <Card className="w-80 text-center p-8 bg-zinc-900/90 border-zinc-700/60 shadow-2xl shadow-black/60">
        <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
        <h2 className="text-[26px] font-bold font-cinzel tracking-widest text-zinc-100">Fim de Jogo</h2>
        <p className="text-xs text-zinc-500 mt-2 tracking-[0.2em] uppercase font-cinzel">Vencedor</p>
        <p className="text-[22px] font-bold mt-3 text-zinc-100 font-cinzel tracking-wide">
          {winner?.name ?? "Desconhecido"}
        </p>
        <Button
          variant="default"
          className="w-full mt-6 min-h-[44px] font-cinzel tracking-widest"
          onClick={() => socket.emit("REMATCH", roomId)}
        >
          Revanche
        </Button>
      </Card>
    </div>
  )
}
