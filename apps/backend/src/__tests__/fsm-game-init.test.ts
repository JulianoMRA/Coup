import { describe, it, expect } from "vitest"
import { CardType, GamePhase } from "@coup/shared"
import type { LobbyPlayer } from "@coup/shared"
import { initGame } from "../game/game-engine"

function makeLobbyPlayers(count: number): LobbyPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    playerId: `p${i + 1}`,
    name: `Player ${i + 1}`,
    isReady: true,
    joinOrder: i,
  }))
}

describe("initGame — deck initialization (INIT-01)", () => {
  it("should build a deck of exactly 15 cards", () => {
    const state = initGame("room-1", makeLobbyPlayers(2))
    const totalCards = state.deck.length + state.players.reduce((acc, p) => acc + p.hand.length, 0)
    expect(totalCards).toBe(15)
  })

  it("should contain exactly 3 of each card type", () => {
    const state = initGame("room-1", makeLobbyPlayers(2))
    const allCards = [...state.deck, ...state.players.flatMap(p => p.hand)]
    const types = [CardType.DUKE, CardType.ASSASSIN, CardType.CAPTAIN, CardType.AMBASSADOR, CardType.CONTESSA]
    for (const type of types) {
      expect(allCards.filter(c => c.type === type)).toHaveLength(3)
    }
  })

  it("should start with all cards revealed: false", () => {
    const state = initGame("room-1", makeLobbyPlayers(2))
    const allCards = [...state.deck, ...state.players.flatMap(p => p.hand)]
    expect(allCards.every(c => !c.revealed)).toBe(true)
  })
})

describe("initGame — player deal (INIT-02)", () => {
  it("should deal exactly 2 cards to each player", () => {
    const state = initGame("room-1", makeLobbyPlayers(4))
    for (const player of state.players) {
      expect(player.hand).toHaveLength(2)
    }
  })

  it("should give each player exactly 2 coins", () => {
    const state = initGame("room-1", makeLobbyPlayers(3))
    for (const player of state.players) {
      expect(player.coins).toBe(2)
    }
  })

  it("should not assign the same card instance to two players", () => {
    const state = initGame("room-1", makeLobbyPlayers(4))
    const allHandCards = state.players.flatMap(p => p.hand)
    const uniqueRefs = new Set(allHandCards)
    expect(uniqueRefs.size).toBe(allHandCards.length)
  })

  it("should set phase to AWAITING_ACTION after init", () => {
    const state = initGame("room-1", makeLobbyPlayers(2))
    expect(state.phase).toBe(GamePhase.AWAITING_ACTION)
  })
})

describe("initGame — turn order (INIT-04)", () => {
  it("should set activePlayerId to the first player in the randomized order", () => {
    const players = makeLobbyPlayers(2)
    const state = initGame("room-1", players)
    expect(state.players.map(p => p.id)).toContain(state.activePlayerId)
  })

  it("should produce different turn orders across multiple calls (probabilistic)", () => {
    const players = makeLobbyPlayers(4)
    const orders = new Set(
      Array.from({ length: 20 }, () =>
        initGame("room-1", players).players.map(p => p.id).join(",")
      )
    )
    expect(orders.size).toBeGreaterThan(1)
  })
})
