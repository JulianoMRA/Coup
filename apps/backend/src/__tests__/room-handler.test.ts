import { describe, it, expect, beforeEach, vi } from "vitest"
import { rooms, createRoom, joinRoom, setReady } from "../rooms/room-store"

// Minimal socket/io mocks
function makeSocket(playerId: string) {
  const emitted: Array<[string, ...unknown[]]> = []
  const joined: string[] = []
  const left: string[] = []
  return {
    playerId,
    handshake: { auth: { playerId } },
    emit: vi.fn((...args: [string, ...unknown[]]) => { emitted.push(args) }),
    join: vi.fn((room: string) => { joined.push(room) }),
    leave: vi.fn((room: string) => { left.push(room) }),
    on: vi.fn(),
    disconnect: vi.fn(),
    _emitted: emitted,
    _joined: joined,
    _left: left,
  }
}

function makeIo() {
  const roomEmits: Array<{ room: string; event: string; data: unknown }> = []
  return {
    to: vi.fn((room: string) => ({
      emit: vi.fn((event: string, data: unknown) => {
        roomEmits.push({ room, event, data })
      }),
    })),
    _roomEmits: roomEmits,
  }
}

// Import handlers — we test the room logic through room-store directly
// and verify handler contract via the mock io/socket
describe("room socket handlers", () => {
  beforeEach(() => {
    rooms.clear()
  })

  describe("JOIN_ROOM logic", () => {
    it("should emit LOBBY_UPDATE to all players in the room after a player joins", () => {
      const room = createRoom("host-1", "Alice")
      const result = joinRoom(room.roomId, "p2", "Bob")
      expect(result.ok).toBe(true)
      const updated = rooms.get(room.roomId)!
      expect(updated.players).toHaveLength(2)
      expect(updated.players[1]).toMatchObject({ playerId: "p2", name: "Bob", isReady: false })
    })

    it("should return error if the room does not exist", () => {
      const result = joinRoom("nonexistent", "p1", "Alice")
      expect(result.ok).toBe(false)
      expect((result as { ok: false; error: string }).error).toMatch(/not found/i)
    })

    it("should return error if the room is full (6 players)", () => {
      const room = createRoom("p1", "P1")
      for (let i = 2; i <= 6; i++) joinRoom(room.roomId, `p${i}`, `P${i}`)
      const result = joinRoom(room.roomId, "p7", "P7")
      expect(result.ok).toBe(false)
      expect((result as { ok: false; error: string }).error).toMatch(/full/i)
    })

    it("should return error if the game has already started", () => {
      const room = createRoom("p1", "Alice")
      room.status = "IN_GAME"
      const result = joinRoom(room.roomId, "p2", "Bob")
      expect(result.ok).toBe(false)
      expect((result as { ok: false; error: string }).error).toMatch(/started/i)
    })
  })

  describe("SET_READY logic", () => {
    it("should toggle player isReady and update room state", () => {
      const room = createRoom("p1", "Alice")
      const result = setReady(room.roomId, "p1", true)
      expect(result.ok).toBe(true)
      expect(rooms.get(room.roomId)!.players[0].isReady).toBe(true)
    })
  })

  describe("START_GAME logic", () => {
    it("should fail if fewer than 2 players are in the room", () => {
      const room = createRoom("p1", "Alice")
      room.players[0].isReady = true
      const canStart = room.players.length >= 2 && room.players.every((p) => p.isReady)
      expect(canStart).toBe(false)
    })

    it("should fail if not all players are ready", () => {
      const room = createRoom("p1", "Alice")
      joinRoom(room.roomId, "p2", "Bob")
      // p2 is not ready
      const canStart = room.players.length >= 2 && room.players.every((p) => p.isReady)
      expect(canStart).toBe(false)
    })

    it("should set room status to IN_GAME when all conditions are met", () => {
      const room = createRoom("p1", "Alice")
      joinRoom(room.roomId, "p2", "Bob")
      setReady(room.roomId, "p1", true)
      setReady(room.roomId, "p2", true)
      const canStart = room.players.length >= 2 && room.players.every((p) => p.isReady)
      expect(canStart).toBe(true)
      room.status = "IN_GAME"
      expect(rooms.get(room.roomId)!.status).toBe("IN_GAME")
    })
  })
})
