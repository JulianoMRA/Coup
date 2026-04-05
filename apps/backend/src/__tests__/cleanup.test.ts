import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { games, setGame, deleteGame } from "../game/game-store"
import { rooms } from "../rooms/room-store"
import { initGame } from "../game/game-engine"
import { startCleanupInterval } from "../cleanup"
import type { LobbyPlayer } from "@coup/shared"
import { GamePhase } from "@coup/shared"

function makeLobbyPlayers(ids: string[]): LobbyPlayer[] {
  return ids.map((id, i) => ({ playerId: id, name: `Player${i + 1}`, isReady: true, joinOrder: i }))
}

function makeIoWithRooms(connectedRoomIds: string[] = []) {
  const adapterRooms = new Map<string, { size: number }>()
  for (const roomId of connectedRoomIds) {
    adapterRooms.set(roomId, { size: 1 })
  }
  return {
    sockets: {
      adapter: {
        rooms: adapterRooms,
      },
    },
  }
}

const ONE_HOUR_MS = 3_600_000

describe("Room cleanup interval", () => {
  const STALE_ROOM = "stale-room-1"
  const ACTIVE_ROOM = "active-room-1"

  beforeEach(() => {
    vi.useFakeTimers()
    games.clear()
    rooms.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("Test 1: Stale GAME_OVER room with no sockets and lastActivityAt > 1h ago is deleted", () => {
    const staleTime = Date.now() - ONE_HOUR_MS - 1000
    rooms.set(STALE_ROOM, {
      roomId: STALE_ROOM,
      players: [],
      hostId: "host",
      maxPlayers: 6,
      status: "GAME_OVER",
      lastActivityAt: staleTime,
    } as any)

    const io = makeIoWithRooms([]) as any
    const interval = startCleanupInterval(io)

    vi.advanceTimersByTime(300_000) // 5 minutes

    expect(rooms.has(STALE_ROOM)).toBe(false)
    clearInterval(interval)
  })

  it("Test 2: Stale LOBBY room with no sockets and lastActivityAt > 1h ago is deleted", () => {
    const staleTime = Date.now() - ONE_HOUR_MS - 1000
    rooms.set(STALE_ROOM, {
      roomId: STALE_ROOM,
      players: [],
      hostId: "host",
      maxPlayers: 6,
      status: "LOBBY",
      lastActivityAt: staleTime,
    } as any)

    const io = makeIoWithRooms([]) as any
    const interval = startCleanupInterval(io)

    vi.advanceTimersByTime(300_000)

    expect(rooms.has(STALE_ROOM)).toBe(false)
    clearInterval(interval)
  })

  it("Test 3: IN_GAME room is never deleted regardless of inactivity", () => {
    const staleTime = Date.now() - ONE_HOUR_MS - 1000
    rooms.set(ACTIVE_ROOM, {
      roomId: ACTIVE_ROOM,
      players: [],
      hostId: "host",
      maxPlayers: 6,
      status: "IN_GAME",
      lastActivityAt: staleTime,
    } as any)

    const io = makeIoWithRooms([]) as any
    const interval = startCleanupInterval(io)

    vi.advanceTimersByTime(300_000)

    expect(rooms.has(ACTIVE_ROOM)).toBe(true)
    clearInterval(interval)
  })

  it("Test 4: Room with connected sockets is never deleted even if old", () => {
    const staleTime = Date.now() - ONE_HOUR_MS - 1000
    rooms.set(STALE_ROOM, {
      roomId: STALE_ROOM,
      players: [],
      hostId: "host",
      maxPlayers: 6,
      status: "GAME_OVER",
      lastActivityAt: staleTime,
    } as any)

    // STALE_ROOM has active sockets
    const io = makeIoWithRooms([STALE_ROOM]) as any
    const interval = startCleanupInterval(io)

    vi.advanceTimersByTime(300_000)

    expect(rooms.has(STALE_ROOM)).toBe(true)
    clearInterval(interval)
  })

  it("Test 5: Room with lastActivityAt < 1h ago is not deleted", () => {
    const recentTime = Date.now() - 30 * 60 * 1000 // 30 minutes ago
    rooms.set(STALE_ROOM, {
      roomId: STALE_ROOM,
      players: [],
      hostId: "host",
      maxPlayers: 6,
      status: "GAME_OVER",
      lastActivityAt: recentTime,
    } as any)

    const io = makeIoWithRooms([]) as any
    const interval = startCleanupInterval(io)

    vi.advanceTimersByTime(300_000)

    expect(rooms.has(STALE_ROOM)).toBe(true)
    clearInterval(interval)
  })
})
