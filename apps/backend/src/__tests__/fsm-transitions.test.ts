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
  it("should cancel action and advance turn when challenged player reveals a non-Duke card (bluffing)", () => {
    // p1 is bluffing TAX — their hand has CAPTAIN (not DUKE), so revealing card[0] confirms the bluff
    const state = makeGameState({
      phase: GamePhase.RESOLVING_CHALLENGE,
      players: [
        { id: "p1", name: "Alice", coins: 2, eliminated: false, hand: [{ type: CardType.CAPTAIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
        { id: "p2", name: "Bob",   coins: 2, eliminated: false, hand: [{ type: CardType.ASSASSIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
      ],
      pendingAction: {
        type: "TAX",
        playerId: "p1",
        pendingReactions: { p2: "CHALLENGED" },
        losingPlayerId: "p1",
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

describe("CHAL-05: card replacement after proven challenge", () => {
  it("Test 1: challenger loses in RESOLVING_CHALLENGE — proven card is swapped and deck length unchanged", () => {
    const state = makeGameState({
      phase: GamePhase.RESOLVING_CHALLENGE,
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
      deck: [{ type: CardType.AMBASSADOR, revealed: false }],
      pendingAction: {
        type: "TAX",
        playerId: "p1",
        pendingReactions: { p2: "CHALLENGED" },
      },
    })
    // p2 challenged p1's TAX but p1 has DUKE — p2 loses influence
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p1 = result.state.players.find(p => p.id === "p1")!
    // p1 still has 2 cards (swap did not lose a card)
    expect(p1.hand).toHaveLength(2)
    // deck length unchanged: one card returned, one drawn = still 1
    expect(result.state.deck).toHaveLength(1)
    // the combined set of p1's hand + deck still contains exactly one DUKE
    const allCards = [...p1.hand, ...result.state.deck]
    expect(allCards.filter(c => c.type === CardType.DUKE)).toHaveLength(1)
  })

  it("Test 2: challenger loses in RESOLVING_BLOCK_CHALLENGE — blocker's proven card is swapped and deck length unchanged", () => {
    const state = makeGameState({
      phase: GamePhase.RESOLVING_BLOCK_CHALLENGE,
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
            { type: CardType.DUKE, revealed: false },
            { type: CardType.CONTESSA, revealed: false },
          ],
        },
      ],
      deck: [{ type: CardType.AMBASSADOR, revealed: false }],
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: "p1",
        pendingReactions: { p1: "CHALLENGED" },
        blockerId: "p2",
        blockerClaimedCard: CardType.DUKE,
      },
    })
    // p1 challenged p2's block (DUKE) but p2 actually has DUKE — p1 loses influence
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p1", cardIndex: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p2 = result.state.players.find(p => p.id === "p2")!
    // p2 still has 2 cards (swap did not lose a card)
    expect(p2.hand).toHaveLength(2)
    // deck length unchanged: one card returned, one drawn = still 1
    expect(result.state.deck).toHaveLength(1)
    // the combined set of p2's hand + deck still contains exactly one DUKE (p2's proven DUKE)
    const allCards = [...p2.hand, ...result.state.deck]
    expect(allCards.filter(c => c.type === CardType.DUKE)).toHaveLength(1)
  })

  it("Test 3: challenged player bluffing — no card swap occurs", () => {
    const state = makeGameState({
      phase: GamePhase.RESOLVING_CHALLENGE,
      players: [
        {
          id: "p1",
          name: "Alice",
          coins: 2,
          eliminated: false,
          hand: [
            { type: CardType.CAPTAIN, revealed: false },
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
      deck: [{ type: CardType.AMBASSADOR, revealed: false }],
      pendingAction: {
        type: "TAX",
        playerId: "p1",
        pendingReactions: { p2: "CHALLENGED" },
      },
    })
    // p2 challenged p1's TAX, p1 does NOT have DUKE — p1 loses influence (bluffing)
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p1", cardIndex: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p1 = result.state.players.find(p => p.id === "p1")!
    // remaining unrevealed card is still CAPTAIN (no swap)
    const unrevealed = p1.hand.filter(c => !c.revealed)
    expect(unrevealed.every(c => c.type === CardType.CAPTAIN)).toBe(true)
  })

  it("Test 4: replaceProvenCard is a no-op when deck is empty", () => {
    const state = makeGameState({
      phase: GamePhase.RESOLVING_CHALLENGE,
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
      deck: [],
      pendingAction: {
        type: "TAX",
        playerId: "p1",
        pendingReactions: { p2: "CHALLENGED" },
      },
    })
    // p2 challenged p1's TAX but p1 has DUKE — deck empty, no crash
    const result = processAction(state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p1 = result.state.players.find(p => p.id === "p1")!
    // hand unchanged since deck is empty
    expect(p1.hand[0].type).toBe(CardType.DUKE)
    expect(result.state.deck).toHaveLength(0)
  })
})

describe("processAction — EXCHANGE_CHOOSE (AWAITING_EXCHANGE)", () => {
  it("should keep 2 chosen cards in player hand", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_EXCHANGE,
      pendingAction: {
        type: "EXCHANGE",
        playerId: "p1",
        pendingReactions: {},
        exchangeCards: [
          { type: CardType.AMBASSADOR, revealed: false },
          { type: CardType.DUKE, revealed: false },
        ],
      },
    })
    // p1 hand: [DUKE, CAPTAIN], exchangeCards: [AMBASSADOR, DUKE]
    // allCards indices: 0=DUKE, 1=CAPTAIN, 2=AMBASSADOR, 3=DUKE
    // Keep indices 0 and 2 → keep DUKE and AMBASSADOR
    const result = processAction(state, { type: "EXCHANGE_CHOOSE", playerId: "p1", keptIndices: [0, 2] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const p1 = result.state.players.find(p => p.id === "p1")!
    expect(p1.hand).toHaveLength(2)
    expect(p1.hand.map(c => c.type)).toContain(CardType.DUKE)
    expect(p1.hand.map(c => c.type)).toContain(CardType.AMBASSADOR)
  })

  it("should return unkept cards to the deck (deck grows by 2)", () => {
    const deckBefore = [{ type: CardType.CONTESSA, revealed: false }]
    const state = makeGameState({
      phase: GamePhase.AWAITING_EXCHANGE,
      deck: deckBefore,
      pendingAction: {
        type: "EXCHANGE",
        playerId: "p1",
        pendingReactions: {},
        exchangeCards: [
          { type: CardType.AMBASSADOR, revealed: false },
          { type: CardType.DUKE, revealed: false },
        ],
      },
    })
    const result = processAction(state, { type: "EXCHANGE_CHOOSE", playerId: "p1", keptIndices: [0, 2] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // Returned 2 cards (CAPTAIN + DUKE at indices 1 and 3), deck was 1 → now 3
    expect(result.state.deck).toHaveLength(3)
  })

  it("should advance to AWAITING_ACTION after exchange choice", () => {
    const state = makeGameState({
      phase: GamePhase.AWAITING_EXCHANGE,
      pendingAction: {
        type: "EXCHANGE",
        playerId: "p1",
        pendingReactions: {},
        exchangeCards: [
          { type: CardType.AMBASSADOR, revealed: false },
          { type: CardType.DUKE, revealed: false },
        ],
      },
    })
    const result = processAction(state, { type: "EXCHANGE_CHOOSE", playerId: "p1", keptIndices: [0, 1] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toBe(GamePhase.AWAITING_ACTION)
    expect(result.state.activePlayerId).toBe("p2")
  })
})

describe("INTEGRATION — Foreign Aid → Block → Challenge block → Blocker proves → Challenger loses", () => {
  it("should complete full block-challenge flow when blocker has Duke", () => {
    // p2 blocks foreign aid with Duke, p1 challenges the block, p2 proves Duke, p1 loses card
    const state0 = makeGameState({
      players: [
        { id: "p1", name: "Alice", coins: 2, eliminated: false,
          hand: [{ type: CardType.CAPTAIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
        { id: "p2", name: "Bob",   coins: 2, eliminated: false,
          hand: [{ type: CardType.DUKE, revealed: false }, { type: CardType.ASSASSIN, revealed: false }] },
      ],
    })

    // Step 1: p1 declares Foreign Aid
    const r1 = processAction(state0, { type: "FOREIGN_AID", playerId: "p1" })
    expect(r1.ok).toBe(true)
    if (!r1.ok) return
    expect(r1.state.phase).toBe(GamePhase.AWAITING_REACTIONS)
    expect(r1.state.pendingAction?.pendingReactions).toEqual({ p2: "WAITING" })

    // Step 2: p2 blocks with Duke
    const r2 = processAction(r1.state, { type: "BLOCK", playerId: "p2", claimedCard: CardType.DUKE })
    expect(r2.ok).toBe(true)
    if (!r2.ok) return
    expect(r2.state.phase).toBe(GamePhase.AWAITING_BLOCK_CHALLENGE)
    expect(r2.state.pendingAction?.pendingReactions).toEqual({ p1: "WAITING" })
    expect(r2.state.pendingAction?.blockerId).toBe("p2")

    // Step 3: p1 challenges the block
    const r3 = processAction(r2.state, { type: "CHALLENGE", playerId: "p1" })
    expect(r3.ok).toBe(true)
    if (!r3.ok) return
    expect(r3.state.phase).toBe(GamePhase.RESOLVING_BLOCK_CHALLENGE)
    expect(r3.state.pendingAction?.losingPlayerId).toBe("p2")

    // Step 4: p2 proves they have Duke (card index 0)
    const r4 = processAction(r3.state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 0 })
    expect(r4.ok).toBe(true)
    if (!r4.ok) return
    // After proof, p1 (challenger) must now lose a card
    expect(r4.state.phase).toBe(GamePhase.RESOLVING_BLOCK_CHALLENGE)
    expect(r4.state.pendingAction?.losingPlayerId).toBe("p1")

    // Step 5: p1 loses a card
    const r5 = processAction(r4.state, { type: "LOSE_INFLUENCE", playerId: "p1", cardIndex: 0 })
    expect(r5.ok).toBe(true)
    if (!r5.ok) return
    // Block stands, action cancelled, next turn (p2's turn)
    expect(r5.state.phase).toBe(GamePhase.AWAITING_ACTION)
  })

  it("should complete flow when blocker is bluffing (no Duke)", () => {
    // p2 blocks foreign aid with Duke but is bluffing, p1 challenges, p2 loses card, p1 gains FA
    const state0 = makeGameState({
      players: [
        { id: "p1", name: "Alice", coins: 2, eliminated: false,
          hand: [{ type: CardType.CAPTAIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
        { id: "p2", name: "Bob",   coins: 2, eliminated: false,
          hand: [{ type: CardType.ASSASSIN, revealed: false }, { type: CardType.CONTESSA, revealed: false }] },
      ],
    })

    const r1 = processAction(state0, { type: "FOREIGN_AID", playerId: "p1" })
    expect(r1.ok).toBe(true); if (!r1.ok) return

    const r2 = processAction(r1.state, { type: "BLOCK", playerId: "p2", claimedCard: CardType.DUKE })
    expect(r2.ok).toBe(true); if (!r2.ok) return

    const r3 = processAction(r2.state, { type: "CHALLENGE", playerId: "p1" })
    expect(r3.ok).toBe(true); if (!r3.ok) return
    expect(r3.state.pendingAction?.losingPlayerId).toBe("p2")

    // p2 selects card (not Duke — bluffing!)
    const r4 = processAction(r3.state, { type: "LOSE_INFLUENCE", playerId: "p2", cardIndex: 0 })
    expect(r4.ok).toBe(true); if (!r4.ok) return
    // Bluff caught: p2 loses card, action resolves (p1 gains FA)
    expect(r4.state.phase).toBe(GamePhase.AWAITING_ACTION)
    expect(r4.state.players.find(p => p.id === "p1")!.coins).toBe(4) // 2 + 2
  })
})
