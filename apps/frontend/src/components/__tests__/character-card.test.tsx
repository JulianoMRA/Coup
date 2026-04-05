import { render, screen } from "@testing-library/react"
import { CharacterCard } from "../character-card"

describe("CharacterCard", () => {
  it("renders face-up Duke card with Crown icon and Duque label", () => {
    render(<CharacterCard type="DUKE" revealed={false} showFace={true} />)
    expect(screen.getByText("Duque")).toBeInTheDocument()
    const container = screen.getByText("Duque").closest("div")
    expect(container?.parentElement?.className ?? "").toContain("character-duke")
  })

  it("renders face-up Captain card with Anchor icon and Capitao label", () => {
    render(<CharacterCard type="CAPTAIN" revealed={false} showFace={true} />)
    expect(screen.getByText("Capitao")).toBeInTheDocument()
    const container = screen.getByText("Capitao").closest("div")
    expect(container?.parentElement?.className ?? "").toContain("character-captain")
  })

  it("renders face-up Assassin card with Sword icon and Assassino label", () => {
    render(<CharacterCard type="ASSASSIN" revealed={false} showFace={true} />)
    expect(screen.getByText("Assassino")).toBeInTheDocument()
    const container = screen.getByText("Assassino").closest("div")
    expect(container?.parentElement?.className ?? "").toContain("character-assassin")
  })

  it("renders face-up Ambassador card with Globe icon and Embaixador label", () => {
    render(<CharacterCard type="AMBASSADOR" revealed={false} showFace={true} />)
    expect(screen.getByText("Embaixador")).toBeInTheDocument()
    const container = screen.getByText("Embaixador").closest("div")
    expect(container?.parentElement?.className ?? "").toContain("character-ambassador")
  })

  it("renders face-up Countess card with Gem icon and Condessa label", () => {
    render(<CharacterCard type="CONTESSA" revealed={false} showFace={true} />)
    expect(screen.getByText("Condessa")).toBeInTheDocument()
    const container = screen.getByText("Condessa").closest("div")
    expect(container?.parentElement?.className ?? "").toContain("character-countess")
  })

  it("renders revealed/eliminated card with opacity-40 and grayscale classes", () => {
    const { container } = render(<CharacterCard type="DUKE" revealed={true} showFace={true} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain("opacity-40")
    expect(card.className).toContain("grayscale")
  })

  it("renders card back when showFace is false with ? text and no character name", () => {
    render(<CharacterCard type="DUKE" revealed={false} showFace={false} />)
    expect(screen.getByText("?")).toBeInTheDocument()
    expect(screen.queryByText("Duque")).not.toBeInTheDocument()
  })

  it("renders different sizes with appropriate dimension classes", () => {
    const { rerender, container } = render(
      <CharacterCard type="DUKE" revealed={false} showFace={true} size="sm" />
    )
    expect((container.firstChild as HTMLElement).className).toContain("w-16")

    rerender(<CharacterCard type="DUKE" revealed={false} showFace={true} size="md" />)
    expect((container.firstChild as HTMLElement).className).toContain("w-20")

    rerender(<CharacterCard type="DUKE" revealed={false} showFace={true} size="lg" />)
    expect((container.firstChild as HTMLElement).className).toContain("w-24")
  })
})
