import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import React from "react"

vi.mock("@/lib/socket", () => ({
  socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}))

import { socket } from "@/lib/socket"

describe("useGame — REJOIN_ROOM on connect", () => {
  it("emits REJOIN_ROOM with roomId when socket connect event fires", async () => {
    const { useGame } = await import("@/hooks/use-game")

    renderHook(() => useGame("room123", "player1"))

    const onCalls = (socket.on as ReturnType<typeof vi.fn>).mock.calls
    const connectEntry = onCalls.find(([event]) => event === "connect")
    expect(connectEntry).toBeDefined()

    const connectHandler = connectEntry![1] as () => void
    connectHandler()

    expect(socket.emit).toHaveBeenCalledWith("REJOIN_ROOM", "room123")
  })
})

describe("PlayerPanel — disconnected indicator", () => {
  it("renders (desconectado) for players in disconnectedPlayers array", async () => {
    const { PlayerPanel } = await import("@/components/player-panel")

    const players = [{ id: "p1", name: "Ana", coins: 2, cardCount: 2, eliminated: false, revealedCards: [] }]
    render(
      React.createElement(PlayerPanel, {
        players,
        activePlayerId: "p2",
        myId: "p3",
        disconnectedPlayers: ["p1"],
      })
    )

    expect(screen.getByText("(desconectado)")).toBeInTheDocument()
  })

  it("does NOT render (desconectado) for players NOT in disconnectedPlayers array", async () => {
    const { PlayerPanel } = await import("@/components/player-panel")

    const players = [{ id: "p1", name: "Ana", coins: 2, cardCount: 2, eliminated: false, revealedCards: [] }]
    render(
      React.createElement(PlayerPanel, {
        players,
        activePlayerId: "p2",
        myId: "p3",
        disconnectedPlayers: [],
      })
    )

    expect(screen.queryByText("(desconectado)")).toBeNull()
  })
})

describe("WinnerOverlay — Revanche button", () => {
  it("renders a button with text Revanche", async () => {
    const { WinnerOverlay } = await import("@/components/winner-overlay")

    const players = [{ id: "p1", name: "Ana", coins: 5, cardCount: 1, eliminated: false, revealedCards: [] }]
    render(
      React.createElement(WinnerOverlay, {
        players,
        roomId: "room123",
      })
    )

    expect(screen.getByRole("button", { name: "Revanche" })).toBeInTheDocument()
  })

  it("emits REMATCH with roomId when Revanche button is clicked", async () => {
    const { WinnerOverlay } = await import("@/components/winner-overlay")

    const players = [{ id: "p1", name: "Ana", coins: 5, cardCount: 1, eliminated: false, revealedCards: [] }]
    render(
      React.createElement(WinnerOverlay, {
        players,
        roomId: "room123",
      })
    )

    fireEvent.click(screen.getByRole("button", { name: "Revanche" }))

    expect(socket.emit).toHaveBeenCalledWith("REMATCH", "room123")
  })
})
