import { describe, it, expect, beforeEach } from "vitest"
import { createRoom, joinRoom, setReady, rooms } from "../rooms/room-store"

describe("room-store", () => {
  beforeEach(() => {
    rooms.clear()
  })

  describe("createRoom", () => {
    it("should return a room with an 8-character alphanumeric roomId", () => {
      const room = createRoom("player-1", "Alice")
      expect(room.roomId).toMatch(/^[a-z0-9]{8}$/)
    })

    it("should set the host as the first player with isReady false", () => {
      const room = createRoom("player-1", "Alice")
      expect(room.hostId).toBe("player-1")
      expect(room.players).toHaveLength(1)
      expect(room.players[0]).toMatchObject({ playerId: "player-1", name: "Alice", isReady: false, joinOrder: 0 })
    })

    it("should generate unique room IDs across multiple calls", () => {
      const room1 = createRoom("p1", "Alice")
      const room2 = createRoom("p2", "Bob")
      expect(room1.roomId).not.toBe(room2.roomId)
    })

    it("should set maxPlayers to 6 and status to LOBBY", () => {
      const room = createRoom("player-1", "Alice")
      expect(room.maxPlayers).toBe(6)
      expect(room.status).toBe("LOBBY")
    })
  })

  describe("joinRoom", () => {
    it("should add a player to the room's player list", () => {
      const room = createRoom("p1", "Alice")
      const result = joinRoom(room.roomId, "p2", "Bob")
      expect(result.ok).toBe(true)
      expect(rooms.get(room.roomId)!.players).toHaveLength(2)
    })

    it("should reject the 7th player with an error", () => {
      const room = createRoom("p1", "P1")
      for (let i = 2; i <= 6; i++) {
        joinRoom(room.roomId, `p${i}`, `P${i}`)
      }
      const result = joinRoom(room.roomId, "p7", "P7")
      expect(result.ok).toBe(false)
      expect((result as { ok: false; error: string }).error).toMatch(/full/i)
    })

    it("should not add a player that is already in the room (idempotent on duplicate playerId)", () => {
      const room = createRoom("p1", "Alice")
      joinRoom(room.roomId, "p2", "Bob")
      const result = joinRoom(room.roomId, "p2", "Bob")
      expect(result.ok).toBe(true)
      expect(rooms.get(room.roomId)!.players).toHaveLength(2)
    })
  })
})
