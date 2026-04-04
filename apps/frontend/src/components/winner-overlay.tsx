import type { PublicPlayerState } from "@coup/shared"
import { Card } from "@/components/ui/card"

interface WinnerOverlayProps {
  players: PublicPlayerState[]
}

export function WinnerOverlay({ players }: WinnerOverlayProps) {
  const winner = players.find((p) => !p.eliminated)

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-80 text-center p-8">
        <h2 className="text-[28px] font-semibold">Fim de Jogo</h2>
        <p className="text-sm text-muted-foreground mt-2">Vencedor!</p>
        <p className="text-[20px] font-semibold mt-4">{winner?.name ?? "Desconhecido"}</p>
      </Card>
    </div>
  )
}
