import { describe, it, expect } from "vitest"
import { projectStateForPlayer } from "../game/project-state"
import type { GameState, PlayerState } from "@coup/shared"
import { CardType, GamePhase } from "@coup/shared"

function makeTestGameState(overrides?: Partial<GameState>): GameState {
  const players: PlayerState[] = [
    {
      id: "player-1",
      name: "Alice",
      coins: 2,
      eliminated: false,
      hand: [
        { type: CardType.DUKE, revealed: false },
        { type: CardType.CAPTAIN, revealed: false },
      ],
    },
    {
      id: "player-2",
      name: "Bob",
      coins: 3,
      eliminated: false,
      hand: [
        { type: CardType.ASSASSIN, revealed: false },
        { type: CardType.CONTESSA, revealed: true },
      ],
    },
    {
      id: "player-3",
      name: "Carol",
      coins: 1,
      eliminated: false,
      hand: [
        { type: CardType.AMBASSADOR, revealed: true },
        { type: CardType.DUKE, revealed: false },
      ],
    },
  ]

  return {
    roomId: "room-001",
    players,
    phase: GamePhase.AWAITING_ACTION,
    activePlayerId: "player-1",
    pendingAction: null,
    deck: [],
    log: ["Game started"],
    ...overrides,
  }
}

describe("projectStateForPlayer", () => {
  it("strips hidden cards — opponent players have no hand field, only cardCount and revealedCards", () => {
    const state = makeTestGameState()
    const result = projectStateForPlayer(state, "player-1")

    const opponentBob = result.players.find((p) => p.id === "player-2")
    expect(opponentBob).toBeDefined()
    expect("hand" in (opponentBob as object)).toBe(false)
    expect(opponentBob!.cardCount).toBeDefined()
    expect(opponentBob!.revealedCards).toBeDefined()
  })

  it("preserves requesting player's full hand with card types and revealed status", () => {
    const state = makeTestGameState()
    const result = projectStateForPlayer(state, "player-1")

    expect(result.myHand).toHaveLength(2)
    expect(result.myHand[0]).toEqual({ type: CardType.DUKE, revealed: false })
    expect(result.myHand[1]).toEqual({ type: CardType.CAPTAIN, revealed: false })
  })

  it("exposes revealed cards for all players including opponents", () => {
    const state = makeTestGameState()
    const result = projectStateForPlayer(state, "player-1")

    const bob = result.players.find((p) => p.id === "player-2")
    const carol = result.players.find((p) => p.id === "player-3")

    expect(bob!.revealedCards).toHaveLength(1)
    expect(bob!.revealedCards[0]).toEqual({ type: CardType.CONTESSA, revealed: true })

    expect(carol!.revealedCards).toHaveLength(1)
    expect(carol!.revealedCards[0]).toEqual({ type: CardType.AMBASSADOR, revealed: true })
  })

  it("returns correct cardCount excluding revealed cards", () => {
    const state = makeTestGameState()
    const result = projectStateForPlayer(state, "player-1")

    const alice = result.players.find((p) => p.id === "player-1")
    const bob = result.players.find((p) => p.id === "player-2")
    const carol = result.players.find((p) => p.id === "player-3")

    // Alice: 2 hidden cards
    expect(alice!.cardCount).toBe(2)
    // Bob: 1 hidden card (CONTESSA is revealed)
    expect(bob!.cardCount).toBe(1)
    // Carol: 1 hidden card (AMBASSADOR is revealed)
    expect(carol!.cardCount).toBe(1)
  })

  it("returns empty myHand array if playerId not found in game state", () => {
    const state = makeTestGameState()
    const result = projectStateForPlayer(state, "unknown-player")

    expect(result.myHand).toEqual([])
  })

  it("preserves phase, activePlayerId, pendingAction, log from game state", () => {
    const pendingAction = { type: "STEAL", playerId: "player-1", targetId: "player-2", pendingReactions: {} }
    const state = makeTestGameState({
      phase: GamePhase.AWAITING_REACTIONS,
      activePlayerId: "player-2",
      pendingAction,
      log: ["Game started", "Alice steals from Bob"],
    })
    const result = projectStateForPlayer(state, "player-1")

    expect(result.phase).toBe(GamePhase.AWAITING_REACTIONS)
    expect(result.activePlayerId).toBe("player-2")
    expect(result.pendingAction).toEqual(pendingAction)
    expect(result.log).toEqual(["Game started", "Alice steals from Bob"])
  })
})
