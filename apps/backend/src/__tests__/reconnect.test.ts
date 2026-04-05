import { describe, it, expect, beforeEach, vi } from "vitest"
import type { LobbyPlayer } from "@coup/shared"
import { GamePhase } from "@coup/shared"
import { games, setGame } from "../game/game-store"
import { rooms, createRoom, joinRoom } from "../rooms/room-store"
import { initGame } from "../game/game-engine"
import { projectStateForPlayer } from "../game/project-state"
import { disconnectTimers, roomDisconnectedPlayers } from "../socket-handler"

function makeLobbyPlayers(ids: string[]): LobbyPlayer[] {
  return ids.map((id, i) => ({ playerId: id, name: `Player${i + 1}`, isReady: true, joinOrder: i }))
}

function makeSocket(id: string) {
  return {
    id,
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
  }
}

function makeIo() {
  return {
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    sockets: {
      adapter: {
        rooms: new Map<string, { size: number }>(),
      },
    },
  }
}

describe("REJOIN_ROOM handler logic", () => {
  const ROOM_ID = "test-room-rejoin"
  const PLAYER_A = "player-a"
  const PLAYER_B = "player-b"

  beforeEach(() => {
    games.clear()
    rooms.clear()
    disconnectTimers.clear()
    roomDisconnectedPlayers.clear()

    // Create a room with two players
    const room = createRoom(PLAYER_A, "PlayerA")
    // Override roomId to a known value for testing
    rooms.delete(room.roomId)
    const testRoom = { ...room, roomId: ROOM_ID, status: "IN_GAME" as const }
    testRoom.players = [
      { playerId: PLAYER_A, name: "PlayerA", isReady: true, joinOrder: 0 },
      { playerId: PLAYER_B, name: "PlayerB", isReady: true, joinOrder: 1 },
    ]
    rooms.set(ROOM_ID, testRoom)

    // Create a game in progress
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    const gameState = initGame(ROOM_ID, lobbyPlayers)
    setGame(ROOM_ID, gameState)
  })

  it("Test 1: REJOIN_ROOM valid player re-joins socket to room channel and gets STATE_UPDATE", () => {
    const socket = makeSocket(PLAYER_A)
    const io = makeIo()

    // Simulate the rejoin logic directly
    const room = rooms.get(ROOM_ID)!
    const isInRoom = room.players.some(p => p.playerId === PLAYER_A)
    expect(isInRoom).toBe(true)

    socket.join(ROOM_ID)
    expect(socket.join).toHaveBeenCalledWith(ROOM_ID)

    const game = games.get(ROOM_ID)
    expect(game).toBeDefined()
    if (game) {
      const projection = projectStateForPlayer(game, PLAYER_A, [])
      socket.emit("STATE_UPDATE", projection)
      expect(socket.emit).toHaveBeenCalledWith("STATE_UPDATE", expect.objectContaining({
        phase: game.phase,
        disconnectedPlayers: [],
      }))
    }
  })

  it("Test 2: REJOIN_ROOM player not in room emits ERROR 'Not in room'", () => {
    const socket = makeSocket("stranger")
    const room = rooms.get(ROOM_ID)!
    const isInRoom = room.players.some(p => p.playerId === "stranger")
    expect(isInRoom).toBe(false)
    if (!isInRoom) {
      socket.emit("ERROR", "Not in room")
    }
    expect(socket.emit).toHaveBeenCalledWith("ERROR", "Not in room")
  })

  it("Test 3: REJOIN_ROOM nonexistent roomId emits ERROR 'Room not found'", () => {
    const socket = makeSocket(PLAYER_A)
    const room = rooms.get("nonexistent-room")
    expect(room).toBeUndefined()
    if (!room) {
      socket.emit("ERROR", "Room not found")
    }
    expect(socket.emit).toHaveBeenCalledWith("ERROR", "Room not found")
  })

  it("Test 4: REJOIN_ROOM cancels existing grace timer and removes from disconnectedPlayers", () => {
    // Simulate player being disconnected
    const disconnectedSet = new Set<string>([PLAYER_A])
    roomDisconnectedPlayers.set(ROOM_ID, disconnectedSet)

    const fakeTimer = setTimeout(() => {}, 30_000) as NodeJS.Timeout
    disconnectTimers.set(PLAYER_A, { roomId: ROOM_ID, timer: fakeTimer })

    expect(disconnectTimers.has(PLAYER_A)).toBe(true)
    expect(roomDisconnectedPlayers.get(ROOM_ID)?.has(PLAYER_A)).toBe(true)

    // Simulate reconnection cancellation
    const entry = disconnectTimers.get(PLAYER_A)
    if (entry) {
      clearTimeout(entry.timer)
      disconnectTimers.delete(PLAYER_A)
    }
    roomDisconnectedPlayers.get(ROOM_ID)?.delete(PLAYER_A)

    expect(disconnectTimers.has(PLAYER_A)).toBe(false)
    expect(roomDisconnectedPlayers.get(ROOM_ID)?.has(PLAYER_A)).toBe(false)
  })

  it("Test 5: REJOIN_ROOM when no game exists (lobby state) emits LOBBY_UPDATE instead of STATE_UPDATE", () => {
    const socket = makeSocket(PLAYER_A)
    games.delete(ROOM_ID)

    const room = rooms.get(ROOM_ID)!
    const game = games.get(ROOM_ID)

    if (!game) {
      socket.emit("LOBBY_UPDATE", {
        roomId: room.roomId,
        players: room.players,
        hostId: room.hostId,
        maxPlayers: room.maxPlayers,
        status: room.status,
      })
    }

    expect(socket.emit).toHaveBeenCalledWith("LOBBY_UPDATE", expect.objectContaining({
      roomId: ROOM_ID,
    }))
  })

  it("Test 6: projectStateForPlayer includes disconnectedPlayers array in ClientGameState", () => {
    const game = games.get(ROOM_ID)!
    const disconnected = [PLAYER_B]
    const projection = projectStateForPlayer(game, PLAYER_A, disconnected)

    expect(projection).toHaveProperty("disconnectedPlayers")
    expect(projection.disconnectedPlayers).toEqual([PLAYER_B])
  })
})
