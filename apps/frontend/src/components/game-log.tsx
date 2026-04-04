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
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Log do Jogo</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div
          role="log"
          aria-live="polite"
          className="overflow-y-auto max-h-[400px] space-y-1"
        >
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma acao ainda.</p>
          ) : (
            log.map((entry, idx) => (
              <p key={idx} className="text-sm">
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
