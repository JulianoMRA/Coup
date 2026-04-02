import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { getPlayerName, savePlayerName } from "../hooks/use-lobby"

describe("room page — username localStorage behavior", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should read coup_player_name from localStorage on mount", () => {
    localStorage.setItem("coup_player_name", "Alice")
    expect(getPlayerName()).toBe("Alice")
  })

  it("should save coup_player_name to localStorage after name is submitted", () => {
    savePlayerName("Bob")
    expect(localStorage.getItem("coup_player_name")).toBe("Bob")
  })

  it("should pre-fill the username input when coup_player_name exists in localStorage", () => {
    localStorage.setItem("coup_player_name", "Carlos")
    const name = getPlayerName()
    expect(name).toBe("Carlos")
  })
})
