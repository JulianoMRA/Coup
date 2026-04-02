import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// Stub — implementation in Plan 03
describe("room page — username localStorage behavior", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should read coup_player_name from localStorage on mount", () => {
    expect(true).toBe(false) // RED: not implemented
  })

  it("should save coup_player_name to localStorage after name is submitted", () => {
    expect(true).toBe(false) // RED: not implemented
  })

  it("should pre-fill the username input when coup_player_name exists in localStorage", () => {
    expect(true).toBe(false) // RED: not implemented
  })
})
