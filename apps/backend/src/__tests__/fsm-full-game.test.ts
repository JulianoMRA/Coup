import { describe, it, expect } from "vitest"
import { GamePhase } from "@coup/shared"
import type { LobbyPlayer } from "@coup/shared"
import { initGame, processAction } from "../game/game-engine"

function makeLobbyPlayers(count: number): LobbyPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    playerId: `p${i + 1}`,
    name: `Player ${i + 1}`,
    isReady: true,
    joinOrder: i,
  }))
}

describe("full 2-player game simulation", () => {
  it("should reach GAME_OVER with a single winner after a complete game", () => {
    let state = initGame("room-sim", makeLobbyPlayers(2))

    function getActive() { return state.activePlayerId }
    function getOther() { return state.players.find(p => p.id !== state.activePlayerId)!.id }

    let turns = 0
    const MAX_TURNS = 200

    while (state.phase !== GamePhase.GAME_OVER && turns < MAX_TURNS) {
      turns++
      const active = getActive()
      const other = getOther()

      if (state.phase === GamePhase.AWAITING_ACTION) {
        const activePlayer = state.players.find(p => p.id === active)!
        if (activePlayer.coins >= 7) {
          const r = processAction(state, { type: "COUP", playerId: active, targetId: other })
          expect(r.ok).toBe(true)
          if (r.ok) state = r.state
        } else {
          const r = processAction(state, { type: "INCOME", playerId: active })
          expect(r.ok).toBe(true)
          if (r.ok) state = r.state
        }
      } else if (state.phase === GamePhase.AWAITING_COUP_TARGET) {
        const target = state.pendingAction!.targetId!
        const targetPlayer = state.players.find(p => p.id === target)!
        const cardIndex = targetPlayer.hand.findIndex(c => !c.revealed)
        const r = processAction(state, { type: "LOSE_INFLUENCE", playerId: target, cardIndex })
        expect(r.ok).toBe(true)
        if (r.ok) state = r.state
      } else if (state.phase === GamePhase.AWAITING_REACTIONS) {
        const reactors = Object.keys(state.pendingAction!.pendingReactions)
        for (const reactor of reactors) {
          if (state.pendingAction!.pendingReactions[reactor] === "WAITING") {
            const r = processAction(state, { type: "PASS", playerId: reactor })
            expect(r.ok).toBe(true)
            if (r.ok) state = r.state
            if (state.phase !== GamePhase.AWAITING_REACTIONS) break
          }
        }
      } else {
        break
      }
    }

    expect(state.phase).toBe(GamePhase.GAME_OVER)
    const survivors = state.players.filter(p => !p.eliminated)
    expect(survivors).toHaveLength(1)
  })
})
