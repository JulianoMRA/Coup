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
    <Card className="bg-zinc-900/50 border-zinc-800 flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-zinc-300">Log do Jogo</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div
          role="log"
          aria-live="polite"
          className="overflow-y-auto h-0 flex-1 space-y-1"
        >
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma acao ainda.</p>
          ) : (
            log.map((entry, idx) => (
              <p key={idx} className="text-sm text-zinc-400">
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
