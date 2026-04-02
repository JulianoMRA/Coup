"use client"

import { useState, useEffect } from "react"
import { socket } from "@/lib/socket"
import type { LobbyState } from "@coup/shared"

const PLAYER_NAME_KEY = "coup_player_name"

export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(PLAYER_NAME_KEY)
}

export function savePlayerName(name: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PLAYER_NAME_KEY, name)
}

export function useLobby(
  roomId: string,
  playerId: string,
  playerName: string | null
): { lobby: LobbyState | null; error: string | null } {
  const [lobby, setLobby] = useState<LobbyState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerName) return

    function joinWhenReady() {
      socket.emit("JOIN_ROOM", roomId, playerName as string)
    }

    if (socket.connected) {
      joinWhenReady()
    } else {
      socket.once("connect", joinWhenReady)
    }

    socket.on("LOBBY_UPDATE", setLobby)
    socket.on("ERROR", setError)

    return () => {
      socket.off("LOBBY_UPDATE", setLobby)
      socket.off("ERROR", setError)
      socket.off("connect", joinWhenReady)
      socket.emit("LEAVE_ROOM", roomId)
    }
  }, [roomId, playerName, playerId])

  return { lobby, error }
}
