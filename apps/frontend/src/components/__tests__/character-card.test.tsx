import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { CharacterCard } from "../character-card"
import { CardType } from "@coup/shared"

describe("CharacterCard", () => {
  it("renders face-up Duke card with Crown icon and Duque label", () => {
    render(<CharacterCard type={CardType.DUKE} revealed={false} showFace={true} />)
    expect(screen.getByText("Duque")).toBeTruthy()
    const container = screen.getByText("Duque").closest("div")
    expect(container?.className ?? "").toContain("character-duke")
  })

  it("renders face-up Captain card with Anchor icon and Capitao label", () => {
    render(<CharacterCard type={CardType.CAPTAIN} revealed={false} showFace={true} />)
    expect(screen.getByText("Capitao")).toBeTruthy()
    const container = screen.getByText("Capitao").closest("div")
    expect(container?.className ?? "").toContain("character-captain")
  })

  it("renders face-up Assassin card with Sword icon and Assassino label", () => {
    render(<CharacterCard type={CardType.ASSASSIN} revealed={false} showFace={true} />)
    expect(screen.getByText("Assassino")).toBeTruthy()
    const container = screen.getByText("Assassino").closest("div")
    expect(container?.className ?? "").toContain("character-assassin")
  })

  it("renders face-up Ambassador card with Globe icon and Embaixador label", () => {
    render(<CharacterCard type={CardType.AMBASSADOR} revealed={false} showFace={true} />)
    expect(screen.getByText("Embaixador")).toBeTruthy()
    const container = screen.getByText("Embaixador").closest("div")
    expect(container?.className ?? "").toContain("character-ambassador")
  })

  it("renders face-up Countess card with Gem icon and Condessa label", () => {
    render(<CharacterCard type={CardType.CONTESSA} revealed={false} showFace={true} />)
    expect(screen.getByText("Condessa")).toBeTruthy()
    const container = screen.getByText("Condessa").closest("div")
    expect(container?.className ?? "").toContain("character-countess")
  })

  it("renders revealed/eliminated card with opacity-40 and grayscale classes", () => {
    const { container } = render(<CharacterCard type={CardType.DUKE} revealed={true} showFace={true} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain("opacity-40")
    expect(card.className).toContain("grayscale")
  })

  it("renders card back (showFace=false) with ? text and no character name", () => {
    render(<CharacterCard type={CardType.DUKE} revealed={false} showFace={false} />)
    expect(screen.getByText("?")).toBeTruthy()
    expect(screen.queryByText("Duque")).toBeNull()
  })

  it("renders different sizes with appropriate dimension classes", () => {
    const { container: sm } = render(<CharacterCard type={CardType.DUKE} revealed={false} size="sm" />)
    const { container: md } = render(<CharacterCard type={CardType.DUKE} revealed={false} size="md" />)
    const { container: lg } = render(<CharacterCard type={CardType.DUKE} revealed={false} size="lg" />)
    expect((sm.firstChild as HTMLElement).className).toContain("w-16")
    expect((md.firstChild as HTMLElement).className).toContain("w-20")
    expect((lg.firstChild as HTMLElement).className).toContain("w-24")
  })
})
