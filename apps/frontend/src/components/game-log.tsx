"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GameLogProps {
  log: string[]
}

export function GameLog({ log }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [log.length])

  return (
    <Card className="bg-zinc-900/60 border-zinc-800/80 flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0 p-4 border-b border-zinc-800/60">
        <CardTitle className="text-base text-zinc-300 font-cinzel tracking-widest uppercase">
          Diário de Jogo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0 p-4 pt-0">
        <div
          role="log"
          aria-live="polite"
          className="overflow-y-auto flex-1 min-h-0 space-y-1.5 pt-3"
        >
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma ação ainda.</p>
          ) : (
            log.map((entry, idx) => (
              <p
                key={idx}
                className={`text-sm leading-snug ${
                  idx === log.length - 1
                    ? "text-zinc-200"
                    : "text-zinc-500"
                }`}
              >
                <span className="text-zinc-600 mr-1.5 text-xs select-none">›</span>
                {entry}
              </p>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </CardContent>
    </Card>
  )
}
