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
}

export function CoupTargetSelector({
  players,
  myId,
  roomId,
  playerId,
  onCancel,
}: CoupTargetSelectorProps) {
  const targets = players.filter((p) => !p.eliminated && p.id !== myId)

  function handleSelectTarget(targetId: string) {
    socket.emit("GAME_ACTION", roomId, { type: "COUP", playerId, targetId })
    onCancel()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border flex flex-col gap-2">
      <p className="text-sm font-semibold text-center mb-4">
        Selecionar alvo para o Golpe
      </p>
      {targets.map((target) => (
        <Button
          key={target.id}
          variant="outline"
          className="w-full justify-start gap-3 ring-2 ring-destructive"
          onClick={() => handleSelectTarget(target.id)}
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-semibold shrink-0">
            {target.name.charAt(0).toUpperCase()}
          </span>
          {target.name}
        </Button>
      ))}
      <Button variant="ghost" className="w-full" onClick={onCancel}>
        Cancelar Golpe
      </Button>
    </div>
  )
}
