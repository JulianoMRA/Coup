import { describe, it, expect } from "vitest"
import { CardType, GamePhase } from "@coup/shared"
import type { GameState } from "@coup/shared"
import { processAction } from "../game/game-engine"

function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    roomId: "room-test",
    players: [
      {
        id: "p1",
        name: "Alice",
        coins: 2,
        eliminated: false,
        hand: [
          { type: CardType.DUKE, revealed: false },
          { type: CardType.CAPTAIN, revealed: false },
        ],
      },
      {
        id: "p2",
        name: "Bob",
        coins: 2,
        eliminated: false,
        hand: [
          { type: CardType.ASSASSIN, revealed: false },
          { type: CardType.CONTESSA, revealed: false },
        ],
      },
    ],
    phase: GamePhase.AWAITING_ACTION,
    activePlayerId: "p1",
    pendingAction: null,
    deck: [{ type: CardType.AMBASSADOR, revealed: false }],
    log: [],
    ...overrides,
  }
}

describe("processAction — guard: wrong player", () => {
  it("should reject action from non-active player", () => {
    const state = makeGameState()
    const result = processAction(state, { type: "INCOME", playerId: "p2" })
    expect(result.ok).toBe(false)
  })
})

describe("processAction — guard: wrong phase", () => {
  it("should reject INCOME during AWAITING_REACTIONS phase", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p2: "WAITING" },
      },
    })
    const result = processAction(state, { type: "INCOME", playerId: "p1" })
    expect(result.ok).toBe(false)
  })
})

describe("processAction — guard: forced coup at 10+ coins", () => {
  it("should reject INCOME when active player has 10 coins", () => {
    const state = makeGameState({
      players: [
        { id: "p1", name: "Alice", coins: 10, eliminated: false, hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.CAPTAIN, revealed: false }] },
        { id: "p2", name: "Bob", coins: 2, eliminated: false, hand: [{ type: CardType.ASSASSIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
      ],
    })
    const result = processAction(state, { type: "INCOME", playerId: "p1" })
    expect(result.ok).toBe(false)
  })
})

describe("processAction — INCOME", () => {
  it("should increment active player coins by 1", () => {
    const state = makeGameState()
    const result = processAction(state, { type: "INCOME", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p1 = result.state.players.find(p => p.id === "p1")!
    expect(p1.coins).toBe(3)
  })

  it("should advance turn to next player", () => {
    const state = makeGameState()
    const result = processAction(state, { type: "INCOME", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.activePlayerId).toBe("p2")
  })

  it("should stay in AWAITING_ACTION phase", () => {
    const state = makeGameState()
    const result = processAction(state, { type: "INCOME", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_ACTION)
  })
})

describe("processAction — FOREIGN_AID", () => {
  it("should enter AWAITING_REACTIONS phase", () => {
    const state = makeGameState()
    const result = processAction(state, { type: "FOREIGN_AID", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_REACTIONS)
  })

  it("should initialize pendingReactions with all non-active players as WAITING", () => {
    const state = makeGameState()
    const result = processAction(state, { type: "FOREIGN_AID", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.pendingAction?.pendingReactions).toEqual({ p2: "WAITING" })
  })
})

describe("processAction — COUP", () => {
  it("should enter AWAITING_COUP_TARGET with 7+ coins", () => {
    const state = makeGameState({
      players: [
        { id: "p1", name: "Alice", coins: 7, eliminated: false, hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.CAPTAIN, revealed: false }] },
        { id: "p2", name: "Bob", coins: 2, eliminated: false, hand: [{ type: CardType.ASSASSIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
      ],
    })
    const result = processAction(state, { type: "COUP", playerId: "p1", targetId: "p2" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_COUP_TARGET)
  })

  it("should deduct 7 coins from active player", () => {
    const state = makeGameState({
      players: [
        { id: "p1", name: "Alice", coins: 7, eliminated: false, hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.CAPTAIN, revealed: false }] },
        { id: "p2", name: "Bob", coins: 2, eliminated: false, hand: [{ type: CardType.ASSASSIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
      ],
    })
    const result = processAction(state, { type: "COUP", playerId: "p1", targetId: "p2" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p1 = result.state.players.find(p => p.id === "p1")!
    expect(p1.coins).toBe(0)
  })

  it("should reject COUP with fewer than 7 coins", () => {
    const state = makeGameState()
    const result = processAction(state, { type: "COUP", playerId: "p1", targetId: "p2" })
    expect(result.ok).toBe(false)
  })
})

describe("processAction — LOSE_INFLUENCE (from AWAITING_COUP_TARGET)", () => {
  it("should reveal the chosen card of the target", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_COUP_TARGET,
      players: [
        { id: "p1", name: "Alice", coins: 0, eliminated: false, hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.CAPTAIN, revealed: false }] },
        { id: "p2", name: "Bob", coins: 2, eliminated: false, hand: [{ type: CardType.ASSASSIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
      ],
      pendingAction: { type: "COUP", playerId: "p1", targetId: "p2", pendingReactions: {} },
    })
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p2 = result.state.players.find(p => p.id === "p2")!
    expect(p2.hand[0].revealed).toBe(true)
  })

  it("should eliminate player when last card is revealed", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_COUP_TARGET,
      players: [
        { id: "p1", name: "Alice", coins: 0, eliminated: false, hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.CAPTAIN, revealed: false }] },
        { id: "p2", name: "Bob", coins: 2, eliminated: false, hand: [{ type: CardType.ASSASSIN, revealed: true }, { type: CardType.CONTESSA, revealed: false }] },
      ],
      pendingAction: { type: "COUP", playerId: "p1", targetId: "p2", pendingReactions: {} },
    })
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p2 = result.state.players.find(p => p.id === "p2")!
    expect(p2.eliminated).toBe(true)
  })

  it("should advance to GAME_OVER when last opponent is eliminated", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_COUP_TARGET,
      players: [
        { id: "p1", name: "Alice", coins: 0, eliminated: false, hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.CAPTAIN, revealed: false }] },
        { id: "p2", name: "Bob", coins: 2, eliminated: false, hand: [{ type: CardType.ASSASSIN, revealed: true }, { type: CardType.CONTESSA, revealed: false }] },
      ],
      pendingAction: { type: "COUP", playerId: "p1", targetId: "p2", pendingReactions: {} },
    })
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.GAME_OVER)
  })
})

describe("processAction — PASS reaction", () => {
  it("should mark the passing player as PASSED in pendingReactions", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p2: "WAITING" },
      },
    })
    const result = processAction(state, { type: "PASS", playerId: "p2" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.pendingAction?.pendingReactions["p2"]).toBe("PASSED")
  })

  it("should resolve action when all players have passed — FOREIGN_AID adds 2 coins", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p2: "WAITING" },
      },
    })
    const result = processAction(state, { type: "PASS", playerId: "p2" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p1 = result.state.players.find(p => p.id === "p1")!
    expect(p1.coins).toBe(4)
    expect(result.state.phase).toBe(GamePhase.AWAITING_ACTION)
  })
})

describe("processAction — CHALLENGE reaction", () => {
  it("should enter RESOLVING_CHALLENGE phase", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "TAX",
        playerId: "p1",
        pendingReactions: { p2: "WAITING" },
      },
    })
    const result = processAction(state, { type: "CHALLENGE", playerId: "p2" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.RESOLVING_CHALLENGE)
  })
})

describe("processAction — BLOCK reaction", () => {
  it("should enter AWAITING_BLOCK_CHALLENGE phase", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p2: "WAITING" },
      },
    })
    const result = processAction(state, { type: "BLOCK", playerId: "p2", claimedCard: CardType.DUKE })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_BLOCK_CHALLENGE)
  })

  it("should record blockerId and blockerClaimedCard in pendingAction", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p2: "WAITING" },
      },
    })
    const result = processAction(state, { type: "BLOCK", playerId: "p2", claimedCard: CardType.DUKE })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.pendingAction?.blockerId).toBe("p2")
    expect(result.state.pendingAction?.blockerClaimedCard).toBe(CardType.DUKE)
  })
})

describe("processAction — CHALLENGE block (AWAITING_BLOCK_CHALLENGE)", () => {
  it("should enter RESOLVING_BLOCK_CHALLENGE phase", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_BLOCK_CHALLENGE,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p2: "BLOCKED" },
        blockerId: "p2",
        blockerClaimedCard: CardType.DUKE,
      },
    })
    const result = processAction(state, { type: "CHALLENGE", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.RESOLVING_BLOCK_CHALLENGE)
  })
})

describe("processAction — PASS block (all pass -> action cancelled)", () => {
  it("should cancel action and advance turn when all pass the block", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_BLOCK_CHALLENGE,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p1: "WAITING", p2: "BLOCKED" },
        blockerId: "p2",
        blockerClaimedCard: CardType.DUKE,
      },
    })
    const result = processAction(state, { type: "PASS", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_ACTION)
    const p1 = result.state.players.find(p => p.id === "p1")!
    expect(p1.coins).toBe(2)
  })
})

describe("processAction — LOSE_INFLUENCE in RESOLVING_CHALLENGE (bluff detected)", () => {
  it("should cancel action and advance turn when challenged player loses", () => {
    const state = makeGameState({
      phase: GamePhase.RESOLVING_CHALLENGE,
      pendingAction: {
        type: "TAX",
        playerId: "p1",
        pendingReactions: { p2: "CHALLENGED" },
      },
    })
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p1", cardIndex: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_ACTION)
    expect(result.state.activePlayerId).toBe("p2")
  })

  it("should resolve action when challenger loses (p1 had the card)", () => {
    const state = makeGameState({
      phase: GamePhase.RESOLVING_CHALLENGE,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p2: "CHALLENGED" },
      },
    })
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_ACTION)
  })
})

describe("processAction — eliminated player skipped in turn advance", () => {
  it("should skip eliminated player and advance to next alive player", () => {
    const state = makeGameState({
      players: [
        { id: "p1", name: "Alice", coins: 2, eliminated: false, hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.CAPTAIN, revealed: false }] },
        { id: "p2", name: "Bob", coins: 2, eliminated: true, hand: [{ type: CardType.ASSASSIN, revealed: true }, { type: CardType.CONTESSA, revealed: true }] },
        { id: "p3", name: "Carol", coins: 2, eliminated: false, hand: [{ type: CardType.AMBASSADOR, revealed: false }, { type: CardType.DUKE, revealed: false }] },
      ],
    })
    const result = processAction(state, { type: "INCOME", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.activePlayerId).toBe("p3")
  })
})

describe("processAction — EXCHANGE enters AWAITING_REACTIONS (not AWAITING_EXCHANGE)", () => {
  it("should NOT draw exchange cards at declaration time", () => {
    const state = makeGameState({
      deck: [
        { type: CardType.AMBASSADOR, revealed: false },
        { type: CardType.DUKE, revealed: false },
      ],
    })
    const deckBefore = state.deck.length
    const result = processAction(state, { type: "EXCHANGE", playerId: "p1" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_REACTIONS)
    expect(result.state.deck.length).toBe(deckBefore)
  })
})
