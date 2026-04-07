"use client"

import type { PublicPlayerState } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Button } from "@/components/ui/button"

interface CoupTargetSelectorProps {
  players: PublicPlayerState[]
  myId: string
  roomId: string
  playerId: string
  onCancel: () => void
  actionType?: string
  label?: string
}

export function CoupTargetSelector({
  players,
  myId,
  roomId,
  playerId,
  onCancel,
  actionType = "COUP",
  label = "Selecionar alvo para o Golpe",
}: CoupTargetSelectorProps) {
  const targets = players.filter((p) => !p.eliminated && p.id !== myId)

  function handleSelectTarget(targetId: string) {
    socket.emit("GAME_ACTION", roomId, { type: actionType as "COUP" | "STEAL" | "ASSASSINATE", playerId, targetId })
    onCancel()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 flex flex-col gap-2">
      <p className="text-sm font-semibold text-center mb-4">
        {label}
      </p>
      {targets.map((target) => (
        <Button
          key={target.id}
          variant="outline"
          className="w-full justify-start gap-3 bg-zinc-900 border border-zinc-700 hover:border-destructive hover:bg-zinc-800"
          onClick={() => handleSelectTarget(target.id)}
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 text-sm font-semibold shrink-0">
            {target.name.charAt(0).toUpperCase()}
          </span>
          {target.name}
        </Button>
      ))}
      <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-300" onClick={onCancel}>
        Cancelar Golpe
      </Button>
    </div>
  )
}
