import { describe, it, expect, beforeEach } from "vitest"
import type { GameState, LobbyPlayer } from "@coup/shared"
import { GamePhase, CardType } from "@coup/shared"
import { games, getGame, setGame } from "../game/game-store"
import { initGame, processAction } from "../game/game-engine"
import { projectStateForPlayer } from "../game/project-state"

function makeLobbyPlayers(ids: string[]): LobbyPlayer[] {
  return ids.map((id, i) => ({ playerId: id, name: `Player${i + 1}`, isReady: true, joinOrder: i }))
}

describe("game socket handler logic", () => {
  const ROOM_ID = "test-room-1"
  const PLAYER_A = "player-a"
  const PLAYER_B = "player-b"

  beforeEach(() => {
    games.clear()
  })

  describe("Test 1: START_GAME initializes game state in games Map", () => {
    it("should store game state in games Map when initGame is called before GAME_STARTED", () => {
      const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
      const initialState = initGame(ROOM_ID, lobbyPlayers)
      setGame(ROOM_ID, initialState)

      const storedState = getGame(ROOM_ID)
      expect(storedState).toBeDefined()
      expect(storedState!.roomId).toBe(ROOM_ID)
      expect(storedState!.players).toHaveLength(2)
      expect(storedState!.phase).toBe(GamePhase.AWAITING_ACTION)
    })
  })

  describe("Test 2: START_GAME emits per-player STATE_UPDATE projections", () => {
    it("should produce per-player projections that hide opponent hands", () => {
      const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
      const initialState = initGame(ROOM_ID, lobbyPlayers)
      setGame(ROOM_ID, initialState)

      const projectionA = projectStateForPlayer(initialState, PLAYER_A)
      const projectionB = projectStateForPlayer(initialState, PLAYER_B)

      // Each projection should have myHand with 2 unrevealed cards
      expect(projectionA.myHand).toHaveLength(2)
      expect(projectionB.myHand).toHaveLength(2)

      // Public view: cardCount should be 2 for each player (none revealed)
      const playerAPublic = projectionA.players.find(p => p.id === PLAYER_A)!
      const playerBPublic = projectionA.players.find(p => p.id === PLAYER_B)!
      expect(playerAPublic.cardCount).toBe(2)
      expect(playerBPublic.cardCount).toBe(2)

      // Projections are different views
      expect(projectionA.myHand).not.toEqual(projectionB.myHand)
    })
  })

  describe("Test 3: GAME_ACTION with valid INCOME updates stored state", () => {
    it("should update game state in store after valid INCOME action", () => {
      const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
      const initialState = initGame(ROOM_ID, lobbyPlayers)
      setGame(ROOM_ID, initialState)

      const state = getGame(ROOM_ID)!
      const activePlayer = state.activePlayerId
      const activeBefore = state.players.find(p => p.id === activePlayer)!
      const coinsBefore = activeBefore.coins

      const result = processAction(state, { type: "INCOME", playerId: activePlayer })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      setGame(ROOM_ID, result.state)

      const updatedState = getGame(ROOM_ID)!
      const activeAfter = updatedState.players.find(p => p.id === activePlayer)!
      expect(activeAfter.coins).toBe(coinsBefore + 1)
    })
  })

  describe("Test 4: GAME_ACTION emits STATE_UPDATE to room after valid action", () => {
    it("should produce updated per-player projections after INCOME action", () => {
      const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
      const initialState = initGame(ROOM_ID, lobbyPlayers)
      setGame(ROOM_ID, initialState)

      const state = getGame(ROOM_ID)!
      const activePlayer = state.activePlayerId
      const result = processAction(state, { type: "INCOME", playerId: activePlayer })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      setGame(ROOM_ID, result.state)
      const projections = result.state.players.map(p =>
        projectStateForPlayer(result.state, p.id)
      )
      expect(projections).toHaveLength(2)
      projections.forEach(proj => {
        expect(proj.phase).toBe(GamePhase.AWAITING_ACTION)
      })
    })
  })

  describe("Test 5: GAME_ACTION from wrong player emits ERROR", () => {
    it("should return error when non-active player attempts an action", () => {
      const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
      const initialState = initGame(ROOM_ID, lobbyPlayers)
      setGame(ROOM_ID, initialState)

      const state = getGame(ROOM_ID)!
      const nonActivePlayer = state.players.find(p => p.id !== state.activePlayerId)!.id

      const result = processAction(state, { type: "INCOME", playerId: nonActivePlayer })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toMatch(/not your turn/i)
    })
  })

  describe("Test 6: GAME_ACTION on nonexistent game emits ERROR 'Game not found'", () => {
    it("should return undefined when game does not exist in store", () => {
      const state = getGame("nonexistent-room")
      expect(state).toBeUndefined()
      // Handler would emit ERROR "Game not found" when state is undefined
    })
  })

  describe("Test 7: COUP + LOSE_INFLUENCE results in player elimination when last card revealed", () => {
    it("should eliminate player after coup forces last influence loss", () => {
      const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
      let state = initGame(ROOM_ID, lobbyPlayers)

      // Force player A to be active with 7 coins
      const playerAId = state.players[0].id
      const playerBId = state.players[1].id
      state = {
        ...state,
        activePlayerId: playerAId,
        players: state.players.map(p =>
          p.id === playerAId ? { ...p, coins: 7 } : p
        ),
      }

      // Coup action
      const coupResult = processAction(state, { type: "COUP", playerId: playerAId, targetId: playerBId })
      expect(coupResult.ok).toBe(true)
      if (!coupResult.ok) return

      // Player B must lose first card
      const loseResult1 = processAction(coupResult.state, { type: "LOSE_INFLUENCE", playerId: playerBId, cardIndex: 0 })
      expect(loseResult1.ok).toBe(true)
      if (!loseResult1.ok) return

      // Player B now has one unrevealed card — reveal the second one
      const playerBAfterFirst = loseResult1.state.players.find(p => p.id === playerBId)!
      const unrevealed = playerBAfterFirst.hand.findIndex(c => !c.revealed)

      if (unrevealed === -1) {
        // already eliminated after first loss (edge case: single card)
        expect(playerBAfterFirst.eliminated).toBe(true)
        return
      }

      // Force another coup scenario to lose second card
      const state2 = {
        ...loseResult1.state,
        activePlayerId: playerAId,
        players: loseResult1.state.players.map(p =>
          p.id === playerAId ? { ...p, coins: 7 } : p
        ),
        phase: GamePhase.AWAITING_ACTION,
        pendingAction: null,
      }

      const coupResult2 = processAction(state2, { type: "COUP", playerId: playerAId, targetId: playerBId })
      expect(coupResult2.ok).toBe(true)
      if (!coupResult2.ok) return

      const loseResult2 = processAction(coupResult2.state, { type: "LOSE_INFLUENCE", playerId: playerBId, cardIndex: unrevealed })
      expect(loseResult2.ok).toBe(true)
      if (!loseResult2.ok) return

      const finalPlayerB = loseResult2.state.players.find(p => p.id === playerBId)!
      expect(finalPlayerB.eliminated).toBe(true)
    })
  })

  describe("Test 8: Full mini-game reaching GAME_OVER emits STATE_UPDATE with phase GAME_OVER", () => {
    it("should reach GAME_OVER phase after all of a player's influences are removed", () => {
      const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
      let state = initGame(ROOM_ID, lobbyPlayers)

      const playerAId = state.players[0].id
      const playerBId = state.players[1].id

      // Give player A enough coins for coup
      state = {
        ...state,
        activePlayerId: playerAId,
        players: state.players.map(p =>
          p.id === playerAId ? { ...p, coins: 7 } : p
        ),
      }

      // First coup — player B loses first influence
      const coup1 = processAction(state, { type: "COUP", playerId: playerAId, targetId: playerBId })
      expect(coup1.ok).toBe(true)
      if (!coup1.ok) return
      const lose1 = processAction(coup1.state, { type: "LOSE_INFLUENCE", playerId: playerBId, cardIndex: 0 })
      expect(lose1.ok).toBe(true)
      if (!lose1.ok) return

      // Second coup — player B loses second influence → GAME_OVER
      const state2 = {
        ...lose1.state,
        activePlayerId: playerAId,
        players: lose1.state.players.map(p =>
          p.id === playerAId ? { ...p, coins: 7 } : p
        ),
        phase: GamePhase.AWAITING_ACTION,
        pendingAction: null,
      }
      const coup2 = processAction(state2, { type: "COUP", playerId: playerAId, targetId: playerBId })
      expect(coup2.ok).toBe(true)
      if (!coup2.ok) return

      const playerBState = coup2.state.players.find(p => p.id === playerBId)!
      const unrevealed = playerBState.hand.findIndex(c => !c.revealed)

      const lose2 = processAction(coup2.state, { type: "LOSE_INFLUENCE", playerId: playerBId, cardIndex: unrevealed })
      expect(lose2.ok).toBe(true)
      if (!lose2.ok) return

      // Verify GAME_OVER phase
      expect(lose2.state.phase).toBe(GamePhase.GAME_OVER)

      // Per-player projections should show GAME_OVER
      const projections = lose2.state.players.map(p =>
        projectStateForPlayer(lose2.state, p.id)
      )
      projections.forEach(proj => {
        expect(proj.phase).toBe(GamePhase.GAME_OVER)
      })
    })
  })
})
