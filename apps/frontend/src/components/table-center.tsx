import { Coin } from "@/components/ui/coin"

interface TableCenterProps {
  deckCount: number
}

export function TableCenter({ deckCount }: TableCenterProps) {
  return (
    <div className="table-center">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div className="court-deck">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="deck-card"
              style={{ transform: `translate(${-i}px, ${-i}px)` }}
            />
          ))}
          <div className="court-deck-count">BARALHO · {deckCount}</div>
        </div>
      </div>

      <div className="treasury">
        <div className="treasury-stack">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Coin
              key={i}
              size={30}
              style={{
                position: "absolute",
                left: (i % 3) * 20,
                top: 40 - i * 3,
                zIndex: i,
              }}
            />
          ))}
        </div>
        <div className="treasury-label">TESOURO CENTRAL</div>
      </div>
    </div>
  )
}
