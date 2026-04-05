import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ActionBar } from "../components/action-bar"
import { GamePhase } from "@coup/shared"
import type { PublicPlayerState } from "@coup/shared"

vi.mock("@/lib/socket", () => ({
  socket: {
    emit: vi.fn(),
  },
}))

const makePlayers = (overrides: Partial<PublicPlayerState>[] = []): PublicPlayerState[] =>
  overrides.map((o, i) => ({
    id: `player-${i}`,
    name: `Player ${i}`,
    coins: 2,
    influenceCount: 2,
    revealedCards: [],
    isEliminated: false,
    ...o,
  }))

const baseProps = {
  roomId: "room-1",
  playerId: "player-0",
  isMyTurn: false,
  myCoins: 2,
  phase: GamePhase.AWAITING_ACTION,
  onSelectCoupTarget: vi.fn(),
  onSelectStealTarget: vi.fn(),
  onSelectAssassinateTarget: vi.fn(),
}

describe("ActionBar — pending reaction indicator", () => {
  it("should render 'Aguardando: Alice, Bob' when pendingReactions has WAITING entries for those players", () => {
    const players = makePlayers([
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ])

    render(
      <ActionBar
        {...baseProps}
        players={players}
        pendingReactions={{ p1: "WAITING", p2: "WAITING" }}
      />
    )

    expect(screen.getByText("Aguardando: Alice, Bob")).toBeTruthy()
  })

  it("should NOT render 'Aguardando' when pendingReactions is null", () => {
    const players = makePlayers([{ id: "p1", name: "Alice" }])

    render(
      <ActionBar
        {...baseProps}
        players={players}
        pendingReactions={null}
      />
    )

    expect(screen.queryByText(/Aguardando:/)).toBeNull()
  })

  it("should NOT render 'Aguardando' when pendingReactions is undefined", () => {
    const players = makePlayers([{ id: "p1", name: "Alice" }])

    render(
      <ActionBar
        {...baseProps}
        players={players}
        pendingReactions={undefined}
      />
    )

    expect(screen.queryByText(/Aguardando:/)).toBeNull()
  })

  it("should NOT render 'Aguardando' when all reactions are PASSED (no WAITING entries)", () => {
    const players = makePlayers([
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ])

    render(
      <ActionBar
        {...baseProps}
        players={players}
        pendingReactions={{ p1: "PASSED", p2: "PASSED" }}
      />
    )

    expect(screen.queryByText(/Aguardando:/)).toBeNull()
  })

  it("should render only WAITING player names (not PASSED/CHALLENGED/BLOCKED players)", () => {
    const players = makePlayers([
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Carlos" },
    ])

    render(
      <ActionBar
        {...baseProps}
        players={players}
        pendingReactions={{ p1: "WAITING", p2: "PASSED", p3: "BLOCKED" }}
      />
    )

    const el = screen.getByText(/Aguardando:/)
    expect(el.textContent).toContain("Alice")
    expect(el.textContent).not.toContain("Bob")
    expect(el.textContent).not.toContain("Carlos")
  })
})
