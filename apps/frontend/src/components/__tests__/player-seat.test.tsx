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

  it("renders card count as stacked card backs", () => {
    render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={false}
        isDisconnected={false}
      />
    )
    const cardBacks = screen.getAllByTestId("character-card-")
    expect(cardBacks.length).toBe(2)
  })

  it("active player has .active class applied", () => {
    const { container } = render(
      <PlayerSeat
        player={basePlayer}
        isActive={true}
        isMe={false}
        isDisconnected={false}
      />
    )
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain("active")
  })

  it("eliminated player has .eliminated class and EXILADO badge text", () => {
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
    expect(outerDiv.className).toContain("eliminated")
    expect(screen.getByText("EXILADO")).toBeTruthy()
  })

  it("isMe player has .is-me class", () => {
    const { container } = render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={true}
        isDisconnected={false}
      />
    )
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain("is-me")
  })

  it("disconnected player shows AUSENTE badge", () => {
    render(
      <PlayerSeat
        player={basePlayer}
        isActive={false}
        isMe={false}
        isDisconnected={true}
      />
    )
    expect(screen.getByText("AUSENTE")).toBeTruthy()
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
