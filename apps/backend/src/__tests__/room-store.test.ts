import { describe, it, expect, beforeEach } from "vitest"

// Stub — implementation in Plan 02
describe("room-store", () => {
  describe("createRoom", () => {
    it("should return a room with an 8-character alphanumeric roomId", () => {
      expect(true).toBe(false) // RED: not implemented
    })

    it("should set the host as the first player with isReady false", () => {
      expect(true).toBe(false) // RED: not implemented
    })

    it("should generate unique room IDs across multiple calls", () => {
      expect(true).toBe(false) // RED: not implemented
    })

    it("should set maxPlayers to 6 and status to LOBBY", () => {
      expect(true).toBe(false) // RED: not implemented
    })
  })

  describe("joinRoom", () => {
    it("should add a player to the room's player list", () => {
      expect(true).toBe(false) // RED: not implemented
    })

    it("should reject the 7th player with an error", () => {
      expect(true).toBe(false) // RED: not implemented
    })

    it("should not add a player that is already in the room (idempotent on duplicate playerId)", () => {
      expect(true).toBe(false) // RED: not implemented
    })
  })
})
