"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Crest } from "@/components/ui/crest"
import { Filigree } from "@/components/ui/filigree"
import { getOrCreatePlayerId } from "@/lib/session"
import { getBackendUrl } from "@/lib/backend-url"
import { getPlayerName, savePlayerName } from "@/hooks/use-lobby"

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [playerId, setPlayerId] = useState("")

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId())
    const saved = getPlayerName()
    if (saved) setUsername(saved)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!/[a-zA-Z0-9 -]/.test(e.key) && e.key.length === 1) {
      e.preventDefault()
    }
  }

  async function handleCreateRoom() {
    if (!username.trim() || !playerId) return
    setIsCreating(true)
    try {
      const res = await fetch(getBackendUrl() + "/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: playerId, hostName: username.trim() }),
      })
      if (!res.ok) return
      const { roomId } = (await res.json()) as { roomId: string }
      savePlayerName(username.trim())
      router.push(`/room/${roomId}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="felt home-shell">
      <div className="home-card frame">
        <span className="frame-corner-tr" />
        <span className="frame-corner-bl" />

        <div className="home-crest">
          <Crest size={56} />
        </div>

        <h1 className="home-title">COUP</h1>
        <div className="home-sub">Manipulação · Blefe · Poder</div>
        <p className="home-tag">Apenas uma família sobreviverá à intriga da corte</p>

        <Filigree />

        <div className="home-form" style={{ marginTop: 20 }}>
          <label className="sc">Seu nome</label>
          <input
            className="coup-input"
            placeholder="Giuliano, Lorenzo, Isabella..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={16}
          />
          <button
            className="btn primary lg"
            disabled={!username.trim() || isCreating}
            onClick={handleCreateRoom}
          >
            {isCreating ? "Criando…" : "Criar Sala"}
          </button>
          <p className="home-invite-hint">ou entre pelo link de convite enviado por um amigo</p>
        </div>
      </div>
    </div>
  )
}
