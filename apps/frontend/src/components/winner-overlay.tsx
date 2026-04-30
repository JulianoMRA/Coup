"use client"

import type { PublicPlayerState } from "@coup/shared"
import { socket } from "@/lib/socket"
import { Filigree } from "@/components/ui/filigree"

interface WinnerOverlayProps {
  players: PublicPlayerState[]
  roomId: string
}

export function WinnerOverlay({ players, roomId }: WinnerOverlayProps) {
  const winner = players.find((p) => !p.eliminated)

  return (
    <div className="dramatic-backdrop">
      <div className="dramatic-panel" style={{ padding: "48px 60px" }}>
        <div className="winner-crest">❦</div>
        <div className="eyebrow" style={{ textAlign: "center", color: "var(--gold)", marginTop: 8 }}>
          Última Família de Pé
        </div>
        <h2 className="display" style={{ fontSize: 64, margin: "12px 0 0", color: "var(--parchment)", textAlign: "center", letterSpacing: "0.05em" }}>
          {winner?.name ?? "Desconhecido"}
        </h2>
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "oklch(0.86 0.03 70 / 0.75)", fontSize: 18, textAlign: "center", marginTop: 6 }}>
          domina a cidade-estado
        </p>
        <Filigree style={{ margin: "22px 0" }} />
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn primary" onClick={() => socket.emit("REMATCH", roomId)}>
            Nova Partida
          </button>
          <button className="btn ghost" onClick={() => window.location.href = "/"}>
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
