"use client"

import { useState, useEffect } from "react"
import { socket } from "@/lib/socket"
import type { ClientGameState } from "@coup/shared"

export function useGame(
  roomId: string,
  playerId: string
): { game: ClientGameState | null; error: string | null } {
  const [game, setGame] = useState<ClientGameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handleStateUpdate(state: ClientGameState) {
      setGame(state)
      setError(null)
    }
    function handleError(msg: string) {
      setError(msg)
    }
    function handleConnect() {
      socket.emit("REJOIN_ROOM", roomId)
    }

    socket.on("STATE_UPDATE", handleStateUpdate)
    socket.on("ERROR", handleError)
    socket.on("connect", handleConnect)

    return () => {
      socket.off("STATE_UPDATE", handleStateUpdate)
      socket.off("ERROR", handleError)
      socket.off("connect", handleConnect)
    }
  }, [roomId, playerId])

  return { game, error }
}
