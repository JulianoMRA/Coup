"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Crest } from "@/components/ui/crest"
import { Filigree } from "@/components/ui/filigree"
import { getOrCreatePlayerId } from "@/lib/session"
import { getPlayerName, savePlayerName, useLobby } from "@/hooks/use-lobby"
import { useGame } from "@/hooks/use-game"
import { GameBoard } from "@/components/game-board"
import { socket } from "@/lib/socket"

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const [playerId, setPlayerId] = useState("")
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [copied, setCopied] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [myReady, setMyReady] = useState(false)

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId())
    const saved = getPlayerName()
    if (saved) setPlayerName(saved)
    socket.connect()
  }, [])

  const { lobby, error } = useLobby(roomId, playerId, playerName)
  const { game, error: gameError } = useGame(roomId, playerId)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!/[a-zA-Z0-9 -]/.test(e.key) && e.key.length === 1) {
      e.preventDefault()
    }
  }

  function handleJoin() {
    if (!nameInput.trim()) return
    savePlayerName(nameInput.trim())
    setPlayerName(nameInput.trim())
  }

  async function handleCopyLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setShowFallback(true)
    }
  }

  function handleReadyToggle() {
    const next = !myReady
    setMyReady(next)
    socket.emit("SET_READY", roomId, next)
  }

  function handleStartGame() {
    socket.emit("START_GAME", roomId)
  }

  // Game active
  if (game) {
    return <GameBoard game={game} playerId={playerId} roomId={roomId} error={gameError} />
  }

  // Room not found
  if (error === "Room not found") {
    return (
      <div className="felt home-shell">
        <div className="home-card frame">
          <span className="frame-corner-tr" />
          <span className="frame-corner-bl" />
          <div className="home-crest"><Crest size={40} /></div>
          <p style={{ textAlign: "center", fontFamily: "var(--font-display)", fontSize: 20, color: "var(--wine-deep)", margin: "0 0 24px" }}>
            Sala não encontrada.
          </p>
          <button className="btn primary lg" onClick={() => router.push("/")}>
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  // Sub-state A: name entry
  if (!playerName) {
    return (
      <div className="felt home-shell">
        <div className="home-card frame">
          <span className="frame-corner-tr" />
          <span className="frame-corner-bl" />
          <div className="home-crest"><Crest size={40} /></div>
          <h1 className="home-title" style={{ fontSize: 48 }}>COUP</h1>
          <div className="home-sub" style={{ marginBottom: 8 }}>Antecâmara · {roomId}</div>
          <Filigree />
          {error && error !== "Room not found" && (
            <p style={{ color: "var(--wine-deep)", fontSize: 13, textAlign: "center", margin: "8px 0 0" }}>
              {error}
            </p>
          )}
          <div className="home-form" style={{ marginTop: 20 }}>
            <label className="sc">Seu nome</label>
            <input
              className="coup-input"
              placeholder="Giuliano, Lorenzo, Isabella..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={16}
              autoFocus
            />
            <button
              className="btn primary lg"
              disabled={!nameInput.trim()}
              onClick={handleJoin}
            >
              Entrar na Sala
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Sub-state B: active lobby
  const isHost = lobby?.hostId === playerId
  const canStart = lobby ? lobby.players.length >= 2 : false
  const seats = lobby ? [...lobby.players] : []
  while (seats.length < 6) seats.push(null as unknown as typeof seats[0])
  const inviteUrl = typeof window !== "undefined" ? window.location.href : ""

  return (
    <div className="felt" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar-brand">
          <Crest size={22} />
          <h1>COUP</h1>
        </div>
        <div className="top-bar-meta">
          <span>SALA · {roomId}</span>
          <span className="divider">◆</span>
          <span>AGUARDANDO</span>
        </div>
      </div>

      {error && (
        <p style={{ padding: "8px 24px", color: "var(--wine-deep)", fontFamily: "var(--font-display)", fontSize: 14 }}>
          {error}
        </p>
      )}

      {/* Main grid */}
      <div className="lobby-shell">
        {/* Left: seats */}
        <div className="lobby-main">
          <div className="lobby-hero">
            <div className="eyebrow">Antecâmara</div>
            <h2 className="lobby-hero-title">A corte se reúne</h2>
            <p className="lobby-hero-desc">
              Convide até cinco amigos. Quando todos estiverem sentados, o Duque pode dar o sinal.
            </p>

            <div style={{ marginTop: 24 }}>
              <div className="eyebrow">Jogadores ({lobby?.players.length ?? 0}/6)</div>
              <div className="lobby-seats">
                {seats.map((p, i) => {
                  if (!p) {
                    return (
                      <div key={`empty-${i}`} className="lobby-seat-card empty">
                        <div className="seat-av">?</div>
                        <div className="seat-nm" style={{ color: "oklch(0.76 0.13 82 / 0.4)", fontSize: 14 }}>
                          Assento livre
                        </div>
                      </div>
                    )
                  }
                  const isMe = p.playerId === playerId
                  const isPlayerHost = p.playerId === lobby?.hostId
                  return (
                    <div key={p.playerId} className={`lobby-seat-card${isPlayerHost ? " host" : ""}`}>
                      <div className="seat-av">{p.name.charAt(0).toUpperCase()}</div>
                      <div className="seat-nm">{p.name}{isMe ? " (você)" : ""}</div>
                      {isPlayerHost && <span className="seat-badge">Anfitrião</span>}
                      {!isPlayerHost && p.isReady && <span className="seat-badge ready">Pronto</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: aside */}
        <aside className="lobby-aside">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Convite</div>
            {showFallback ? (
              <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--parchment)", wordBreak: "break-all" }}>
                {inviteUrl}
              </p>
            ) : (
              <div className="invite-link">
                <input readOnly value={inviteUrl} />
                <button className="btn gold sm" style={{ borderRadius: 0, border: "none", minWidth: 90 }} onClick={handleCopyLink}>
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            )}
            <p className="invite-link-hint">Compartilhe o link — qualquer um com ele pode entrar.</p>
          </div>

          <Filigree />

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Regras desta partida</div>
            <ul className="lobby-rules">
              <li>◆ 5 personagens clássicos</li>
              <li>◆ Artes iguais (menos informação)</li>
              <li>◆ Turno de 30 segundos</li>
              <li>◆ Contestação permitida</li>
            </ul>
          </div>

          <div style={{ flex: 1 }} />

          <Filigree />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className={`btn ${myReady ? "ghost" : "primary"} lg`}
              onClick={handleReadyToggle}
            >
              {myReady ? "Cancelar Prontidão" : "Estou Pronto!"}
            </button>

            {isHost ? (
              <button
                className="btn primary lg"
                disabled={!canStart}
                onClick={handleStartGame}
              >
                {canStart ? "Iniciar Partida" : "Aguardando jogadores…"}
              </button>
            ) : (
              <div className="lobby-aside-title">
                Aguardando o anfitrião iniciar…
              </div>
            )}

            <button className="btn ghost sm" onClick={() => router.push("/")}>
              Sair da sala
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
