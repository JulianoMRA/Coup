import { getOrCreatePlayerId } from "@/lib/session"

describe("getOrCreatePlayerId", () => {
  let storage: Record<string, string>

  beforeEach(() => {
    storage = {}
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => { storage[key] = value },
        removeItem: (key: string) => { delete storage[key] },
        clear: () => { storage = {} },
      },
      writable: true,
    })
  })

  it("returns existing UUID from localStorage when present", () => {
    const existingId = "existing-uuid-1234"
    storage["coup_player_id"] = existingId

    const result = getOrCreatePlayerId()

    expect(result).toBe(existingId)
  })

  it("generates a new UUID v4 and persists to localStorage when none exists", () => {
    const result = getOrCreatePlayerId()

    expect(result).toBeTruthy()
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
    expect(storage["coup_player_id"]).toBe(result)
  })

  it("returns empty string during SSR when window is undefined", () => {
    const originalWindow = global.window
    // @ts-expect-error: simulate SSR
    delete global.window

    const result = getOrCreatePlayerId()

    expect(result).toBe("")

    global.window = originalWindow
  })

  it("returns the same UUID on repeated calls", () => {
    const first = getOrCreatePlayerId()
    const second = getOrCreatePlayerId()

    expect(first).toBe(second)
  })
})
