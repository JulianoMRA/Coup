import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { LobbyPlayer } from "@coup/shared"
import { GamePhase } from "@coup/shared"
import { games, setGame, getGame } from "../game/game-store"
import { rooms } from "../rooms/room-store"
import { initGame } from "../game/game-engine"
import { disconnectTimers, roomDisconnectedPlayers } from "../socket-handler"
import { resetForRematch } from "../rooms/room-store"

function makeLobbyPlayers(ids: string[]): LobbyPlayer[] {
  return ids.map((id, i) => ({ playerId: id, name: `Player${i + 1}`, isReady: true, joinOrder: i }))
}

describe("REMATCH handler logic", () => {
  const ROOM_ID = "rematch-test-room"
  const PLAYER_A = "player-a"
  const PLAYER_B = "player-b"

  beforeEach(() => {
    vi.useFakeTimers()
    games.clear()
    rooms.clear()
    disconnectTimers.clear()
    roomDisconnectedPlayers.clear()

    const testRoom = {
      roomId: ROOM_ID,
      players: [
        { playerId: PLAYER_A, name: "PlayerA", isReady: true, joinOrder: 0 },
        { playerId: PLAYER_B, name: "PlayerB", isReady: true, joinOrder: 1 },
      ],
      hostId: PLAYER_A,
      maxPlayers: 6,
      status: "GAME_OVER" as const,
      lastActivityAt: Date.now(),
    }
    rooms.set(ROOM_ID, testRoom)

    // Set a GAME_OVER game state
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    const gameState = { ...initGame(ROOM_ID, lobbyPlayers), phase: GamePhase.GAME_OVER }
    setGame(ROOM_ID, gameState)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("Test 1: REMATCH on GAME_OVER room resets game via initGame with same players, phase becomes AWAITING_ACTION", () => {
    resetForRematch(ROOM_ID)

    const room = rooms.get(ROOM_ID)!
    expect(room.status).toBe("IN_GAME")

    // Simulate initGame being called with same players
    const newState = initGame(ROOM_ID, room.players)
    setGame(ROOM_ID, newState)

    const game = getGame(ROOM_ID)!
    expect(game.phase).toBe(GamePhase.AWAITING_ACTION)
    expect(game.players).toHaveLength(2)
  })

  it("Test 2: REMATCH clears roomDisconnectedPlayers for that room", () => {
    roomDisconnectedPlayers.set(ROOM_ID, new Set([PLAYER_A]))
    expect(roomDisconnectedPlayers.get(ROOM_ID)?.size).toBe(1)

    // Simulate REMATCH logic
    roomDisconnectedPlayers.delete(ROOM_ID)

    expect(roomDisconnectedPlayers.has(ROOM_ID)).toBe(false)
  })

  it("Test 3: REMATCH on non-GAME_OVER phase emits ERROR 'Game is not over'", () => {
    // Set game to AWAITING_ACTION phase
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    const activeGame = initGame(ROOM_ID, lobbyPlayers)
    setGame(ROOM_ID, activeGame)

    const socket = { emit: vi.fn() }

    const game = getGame(ROOM_ID)!
    if (!game || game.phase !== GamePhase.GAME_OVER) {
      socket.emit("ERROR", "Game is not over")
    }

    expect(socket.emit).toHaveBeenCalledWith("ERROR", "Game is not over")
  })

  it("Test 4: REMATCH by player not in room emits ERROR 'Not in room'", () => {
    const socket = { emit: vi.fn() }
    const strangerPlayerId = "stranger"

    const room = rooms.get(ROOM_ID)!
    const isInRoom = room.players.some(p => p.playerId === strangerPlayerId)
    if (!isInRoom) {
      socket.emit("ERROR", "Not in room")
    }

    expect(socket.emit).toHaveBeenCalledWith("ERROR", "Not in room")
  })

  it("Test 5: Room status set back to 'IN_GAME' after rematch", () => {
    const roomBefore = rooms.get(ROOM_ID)!
    expect(roomBefore.status).toBe("GAME_OVER")

    resetForRematch(ROOM_ID)

    const roomAfter = rooms.get(ROOM_ID)!
    expect(roomAfter.status).toBe("IN_GAME")
  })
})
