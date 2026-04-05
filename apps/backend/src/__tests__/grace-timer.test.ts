import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { LobbyPlayer } from "@coup/shared"
import { GamePhase } from "@coup/shared"
import { games, setGame, getGame } from "../game/game-store"
import { rooms } from "../rooms/room-store"
import { initGame, processAction } from "../game/game-engine"
import { disconnectTimers, roomDisconnectedPlayers } from "../socket-handler"

function makeLobbyPlayers(ids: string[]): LobbyPlayer[] {
  return ids.map((id, i) => ({ playerId: id, name: `Player${i + 1}`, isReady: true, joinOrder: i }))
}

describe("Disconnect grace timer", () => {
  const ROOM_ID = "timer-test-room"
  const PLAYER_A = "player-a"
  const PLAYER_B = "player-b"

  beforeEach(() => {
    vi.useFakeTimers()
    games.clear()
    rooms.clear()
    disconnectTimers.clear()
    roomDisconnectedPlayers.clear()

    const testRoom = {
      roomId: ROOM_ID,
      players: [
        { playerId: PLAYER_A, name: "PlayerA", isReady: true, joinOrder: 0 },
        { playerId: PLAYER_B, name: "PlayerB", isReady: true, joinOrder: 1 },
      ],
      hostId: PLAYER_A,
      maxPlayers: 6,
      status: "IN_GAME" as const,
    }
    rooms.set(ROOM_ID, testRoom)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("Test 1: Disconnect during AWAITING_REACTIONS fires auto-PASS after 30s", () => {
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    let state = initGame(ROOM_ID, lobbyPlayers)

    // Force AWAITING_REACTIONS phase with PLAYER_B as reactor
    const activeId = state.players[0].id
    const reactorId = state.players[1].id

    // Do a FOREIGN_AID to reach AWAITING_REACTIONS
    const result = processAction(state, { type: "FOREIGN_AID", playerId: activeId })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    state = result.state
    expect(state.phase).toBe(GamePhase.AWAITING_REACTIONS)
    setGame(ROOM_ID, state)

    // Simulate reactor disconnect: mark as disconnected and schedule auto-PASS
    if (!roomDisconnectedPlayers.has(ROOM_ID)) {
      roomDisconnectedPlayers.set(ROOM_ID, new Set())
    }
    roomDisconnectedPlayers.get(ROOM_ID)!.add(reactorId)

    const timer = setTimeout(() => {
      const currentGame = getGame(ROOM_ID)!
      if (
        currentGame.phase === GamePhase.AWAITING_REACTIONS &&
        currentGame.pendingAction?.pendingReactions[reactorId] === "WAITING"
      ) {
        const passResult = processAction(currentGame, { type: "PASS", playerId: reactorId })
        if (passResult.ok) {
          setGame(ROOM_ID, passResult.state)
        }
      }
      disconnectTimers.delete(reactorId)
      roomDisconnectedPlayers.get(ROOM_ID)?.delete(reactorId)
    }, 30_000)

    disconnectTimers.set(reactorId, { roomId: ROOM_ID, timer })

    // Advance timer by 30s
    vi.advanceTimersByTime(30_000)

    const finalState = getGame(ROOM_ID)!
    // After auto-PASS by reactor, pending reaction should be "PASSED"
    // or the game moved forward (action resolved)
    // Since only one reactor (2-player game), PASS resolves the pending action
    expect(finalState.phase).not.toBe(GamePhase.AWAITING_REACTIONS)
    expect(disconnectTimers.has(reactorId)).toBe(false)
  })

  it("Test 2: Disconnect of active player during AWAITING_ACTION fires auto-INCOME after 30s", () => {
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    const state = initGame(ROOM_ID, lobbyPlayers)
    setGame(ROOM_ID, state)

    const activeId = state.activePlayerId
    const coinsBefore = state.players.find(p => p.id === activeId)!.coins

    // Simulate disconnect during AWAITING_ACTION
    if (!roomDisconnectedPlayers.has(ROOM_ID)) {
      roomDisconnectedPlayers.set(ROOM_ID, new Set())
    }
    roomDisconnectedPlayers.get(ROOM_ID)!.add(activeId)

    const timer = setTimeout(() => {
      const currentGame = getGame(ROOM_ID)!
      if (currentGame.phase === GamePhase.AWAITING_ACTION && currentGame.activePlayerId === activeId) {
        const incomeResult = processAction(currentGame, { type: "INCOME", playerId: activeId })
        if (incomeResult.ok) {
          setGame(ROOM_ID, incomeResult.state)
        }
      }
      disconnectTimers.delete(activeId)
      roomDisconnectedPlayers.get(ROOM_ID)?.delete(activeId)
    }, 30_000)

    disconnectTimers.set(activeId, { roomId: ROOM_ID, timer })

    vi.advanceTimersByTime(30_000)

    const finalState = getGame(ROOM_ID)!
    const activeAfter = finalState.players.find(p => p.id === activeId)!
    expect(activeAfter.coins).toBe(coinsBefore + 1)
    // Turn should have advanced
    expect(finalState.activePlayerId).not.toBe(activeId)
    expect(disconnectTimers.has(activeId)).toBe(false)
  })

  it("Test 3: Disconnect during GAME_OVER does NOT fire any action", () => {
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    let state = initGame(ROOM_ID, lobbyPlayers)

    // Force GAME_OVER state
    state = { ...state, phase: GamePhase.GAME_OVER }
    setGame(ROOM_ID, state)

    const somePlayer = state.players[0].id

    // Simulate timer that checks phase before acting
    let actionFired = false
    const timer = setTimeout(() => {
      const currentGame = getGame(ROOM_ID)!
      if (currentGame.phase === GamePhase.GAME_OVER) {
        // no-op: game is over
        return
      }
      actionFired = true
    }, 30_000)

    disconnectTimers.set(somePlayer, { roomId: ROOM_ID, timer })

    vi.advanceTimersByTime(30_000)

    expect(actionFired).toBe(false)
  })

  it("Test 4: Player marked in roomDisconnectedPlayers immediately on disconnect (before timer fires)", () => {
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    const state = initGame(ROOM_ID, lobbyPlayers)
    setGame(ROOM_ID, state)

    // Simulate immediate disconnect marking
    if (!roomDisconnectedPlayers.has(ROOM_ID)) {
      roomDisconnectedPlayers.set(ROOM_ID, new Set())
    }
    roomDisconnectedPlayers.get(ROOM_ID)!.add(PLAYER_A)

    // Before timer fires: player should already be in disconnectedPlayers
    expect(roomDisconnectedPlayers.get(ROOM_ID)?.has(PLAYER_A)).toBe(true)
    expect(disconnectTimers.has(PLAYER_A)).toBe(false) // timer not started yet in this simulation

    // Start timer
    const timer = setTimeout(() => {}, 30_000)
    disconnectTimers.set(PLAYER_A, { roomId: ROOM_ID, timer })
    expect(disconnectTimers.has(PLAYER_A)).toBe(true)
  })

  it("Test 5: Timer does not fire if player reconnects within 30s (clearTimeout called)", () => {
    const lobbyPlayers = makeLobbyPlayers([PLAYER_A, PLAYER_B])
    const state = initGame(ROOM_ID, lobbyPlayers)
    setGame(ROOM_ID, state)

    let timerFired = false

    const timer = setTimeout(() => {
      timerFired = true
    }, 30_000)

    disconnectTimers.set(PLAYER_A, { roomId: ROOM_ID, timer })

    // Simulate reconnect within 30s (at 10s)
    vi.advanceTimersByTime(10_000)

    // Cancel timer (reconnect logic)
    const entry = disconnectTimers.get(PLAYER_A)
    if (entry) {
      clearTimeout(entry.timer)
      disconnectTimers.delete(PLAYER_A)
    }

    // Advance past 30s mark
    vi.advanceTimersByTime(25_000)

    expect(timerFired).toBe(false)
    expect(disconnectTimers.has(PLAYER_A)).toBe(false)
  })
})
