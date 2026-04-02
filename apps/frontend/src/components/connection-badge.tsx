"use client"

import { useSocketStatus, type ConnectionStatus } from "@/hooks/use-socket"

const dotClass: Record<ConnectionStatus, string> = {
  connected: "w-2 h-2 rounded-full bg-emerald-500",
  connecting: "w-2 h-2 rounded-full bg-yellow-500 animate-pulse",
  disconnected: "w-2 h-2 rounded-full bg-red-500",
  error: "w-2 h-2 rounded-full bg-red-500",
}

const labelClass: Record<ConnectionStatus, string> = {
  connected: "text-sm text-muted-foreground",
  connecting: "text-sm text-muted-foreground",
  disconnected: "text-sm text-destructive",
  error: "text-sm text-destructive",
}

const labelText: Record<ConnectionStatus, string> = {
  connected: "Conectado",
  connecting: "Conectando...",
  disconnected: "Desconectado",
  error: "Erro de conexão",
}

export function ConnectionBadge() {
  const status = useSocketStatus()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 px-2 py-1 rounded-md bg-card">
      <span className={dotClass[status]} />
      <span className={labelClass[status]}>{labelText[status]}</span>
    </div>
  )
}
