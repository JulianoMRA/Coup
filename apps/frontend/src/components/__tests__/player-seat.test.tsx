import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { PlayerSeat } from "../player-seat"
import type { PublicPlayerState } from "@coup/shared"
import { CardType } from "@coup/shared"

vi.mock("../character-card", () => ({
  CharacterCard: ({ type }: { type: string }) => (
    <div data-testid={`character-card-${type}`} />
  ),
}))

const basePlayer: PublicPlayerState = {
  id: "player-1",
  name: "Alice",
  coins: 3,
  eliminated: false,
  cardCount: 2,
  revealedCards: [],
}

describe("PlayerSeat", () => {
  it("renders player name and avatar initial (first letter uppercase)", () => {
    render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={false}
        isDisconnected={false}
      />
    )
    expect(screen.getByText("Alice")).toBeTruthy()
    expect(screen.getByText("A")).toBeTruthy()
  })

  it("renders coin count with Coins icon present", () => {
    render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={false}
        isDisconnected={false}
      />
    )
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("renders card count with Shield icon present", () => {
    render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={false}
        isDisconnected={false}
      />
    )
    expect(screen.getByText("2")).toBeTruthy()
  })

  it("active player has ring-2 class applied", () => {
    const { container } = render(
      <PlayerSeat
        player={basePlayer}
        isActive={true}
        isMe={false}
        isDisconnected={false}
      />
    )
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain("ring-2")
  })

  it("eliminated player has opacity-40 class and Eliminado badge text", () => {
    const eliminatedPlayer = { ...basePlayer, eliminated: true }
    const { container } = render(
      <PlayerSeat
        player={eliminatedPlayer}
        isActive={false}
        isMe={false}
        isDisconnected={false}
      />
    )
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain("opacity-40")
    expect(screen.getByText("Eliminado")).toBeTruthy()
  })

  it("isMe player shows (voce) text", () => {
    render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={true}
        isDisconnected={false}
      />
    )
    expect(screen.getByText("(voce)")).toBeTruthy()
  })

  it("disconnected player shows (desconectado) text", () => {
    render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={false}
        isDisconnected={true}
      />
    )
    expect(screen.getByText("(desconectado)")).toBeTruthy()
  })

  it("renders revealed cards with CharacterCard components", () => {
    const playerWithCards: PublicPlayerState = {
      ...basePlayer,
      revealedCards: [
        { type: CardType.DUKE, revealed: true },
        { type: CardType.ASSASSIN, revealed: true },
      ],
    }
    render(
      <PlayerSeat
        player={playerWithCards}
        isActive={false}
        isMe={false}
        isDisconnected={false}
      />
    )
    expect(screen.getByTestId("character-card-DUKE")).toBeTruthy()
    expect(screen.getByTestId("character-card-ASSASSIN")).toBeTruthy()
  })
})
