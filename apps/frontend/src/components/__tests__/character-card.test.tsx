import { render, screen } from "@testing-library/react"
import { CharacterCard } from "../character-card"

describe("CharacterCard", () => {
  it("renders face-up Duke card with .coup-card class and Duque label", () => {
    const { container } = render(<CharacterCard type="DUKE" revealed={false} showFace={true} />)
    expect(screen.getByText("Duque")).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).className).toContain("coup-card")
  })

  it("renders face-up Captain card with .coup-card class and Capitão label", () => {
    const { container } = render(<CharacterCard type="CAPTAIN" revealed={false} showFace={true} />)
    expect(screen.getByText("Capitão")).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).className).toContain("coup-card")
  })

  it("renders face-up Assassin card with .coup-card class and Assassino label", () => {
    const { container } = render(<CharacterCard type="ASSASSIN" revealed={false} showFace={true} />)
    expect(screen.getByText("Assassino")).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).className).toContain("coup-card")
  })

  it("renders face-up Ambassador card with .coup-card class and Embaixador label", () => {
    const { container } = render(<CharacterCard type="AMBASSADOR" revealed={false} showFace={true} />)
    expect(screen.getByText("Embaixador")).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).className).toContain("coup-card")
  })

  it("renders face-up Countess card with .coup-card class and Condessa label", () => {
    const { container } = render(<CharacterCard type="CONTESSA" revealed={false} showFace={true} />)
    expect(screen.getByText("Condessa")).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).className).toContain("coup-card")
  })

  it("renders revealed card with .revealed class", () => {
    const { container } = render(<CharacterCard type="DUKE" revealed={true} showFace={true} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain("coup-card")
    expect(card.className).toContain("revealed")
  })

  it("renders card back when showFace is false with COUP crest and no character name", () => {
    const { container } = render(<CharacterCard type="DUKE" revealed={false} showFace={false} />)
    expect(container.querySelector(".card-back")).toBeTruthy()
    expect(screen.queryByText("Duque")).not.toBeInTheDocument()
  })

  it("renders different sizes with appropriate size classes", () => {
    const { rerender, container } = render(
      <CharacterCard type="DUKE" revealed={false} showFace={true} size="sm" />
    )
    expect((container.firstChild as HTMLElement).className).toContain("sm")

    rerender(<CharacterCard type="DUKE" revealed={false} showFace={true} size="md" />)
    expect((container.firstChild as HTMLElement).className).toContain("coup-card")

    rerender(<CharacterCard type="DUKE" revealed={false} showFace={true} size="lg" />)
    expect((container.firstChild as HTMLElement).className).toContain("lg")
  })
})
