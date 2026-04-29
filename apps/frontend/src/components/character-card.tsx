"use client"

import type { CardType } from "@coup/shared"

type CardSize = "xs" | "sm" | "md" | "lg"

interface CharacterDef {
  name: string
  subtitle: string
  color: string
  initial: string
  symbol: string
  ability: string
  counter: string
}

export const CHARACTERS: Record<string, CharacterDef> = {
  DUKE: {
    name: "Duque",
    subtitle: "Il Duca",
    color: "var(--house-duke)",
    initial: "D",
    symbol: "♕",
    ability: "Receba 3 moedas do Tesouro.",
    counter: "Bloqueia Ajuda Externa.",
  },
  CAPTAIN: {
    name: "Capitão",
    subtitle: "Il Capitano",
    color: "var(--house-captain)",
    initial: "C",
    symbol: "⚓",
    ability: "Roube 2 moedas de outro jogador.",
    counter: "Bloqueia Roubar.",
  },
  ASSASSIN: {
    name: "Assassino",
    subtitle: "L'Assassino",
    color: "var(--house-assassin)",
    initial: "A",
    symbol: "†",
    ability: "Pague 3 moedas para assassinar.",
    counter: "—",
  },
  AMBASSADOR: {
    name: "Embaixador",
    subtitle: "L'Ambasciatore",
    color: "var(--house-ambassador)",
    initial: "E",
    symbol: "✦",
    ability: "Troque cartas com o Baralho da Corte.",
    counter: "Bloqueia Roubar.",
  },
  CONTESSA: {
    name: "Condessa",
    subtitle: "La Contessa",
    color: "var(--house-contessa)",
    initial: "C",
    symbol: "✿",
    ability: "Nenhuma ação.",
    counter: "Bloqueia Assassinato.",
  },
}

/* Backwards-compat shim — block-claim-selector still imports CHARACTER_CONFIG; remove when Phase 7 reskins it */
export const CHARACTER_CONFIG: Record<string, {
  label: string
  initial: string
  colorClass: string
  borderClass: string
  Icon: React.ComponentType<{ className?: string }>
}> = Object.fromEntries(
  Object.entries(CHARACTERS).map(([key, c]) => [
    key,
    {
      label: c.name,
      initial: c.initial,
      colorClass: "",
      borderClass: "",
      Icon: () => <span style={{ color: c.color }}>{c.symbol}</span>,
    },
  ])
)

/* ── SVG Portraits ──────────────────────────────────────────── */

function DukePortrait() {
  return (
    <svg viewBox="0 0 100 130" className="portrait-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 30 L35 18 L42 27 L50 14 L58 27 L65 18 L70 30 Z M28 30 h44 v5 H28 z" fill="currentColor" opacity="0.9" />
      <circle cx="35" cy="18" r="2.2" fill="currentColor" />
      <circle cx="50" cy="14" r="2.5" fill="currentColor" />
      <circle cx="65" cy="18" r="2.2" fill="currentColor" />
      <ellipse cx="50" cy="52" rx="15" ry="19" fill="currentColor" opacity="0.18" />
      <path d="M36 50 Q38 40 50 38 Q62 40 64 50 L64 58 Q62 66 50 67 Q38 66 36 58 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M42 60 Q50 75 58 60 L58 66 Q50 78 42 66 Z" fill="currentColor" opacity="0.6" />
      <path d="M18 130 Q20 95 40 85 L60 85 Q80 95 82 130 Z" fill="currentColor" opacity="0.25" />
      <path d="M18 130 Q20 95 40 85 L60 85 Q80 95 82 130" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="50" cy="105" r="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M50 101 L52 105 L50 109 L48 105 Z" fill="currentColor" />
    </svg>
  )
}

function CaptainPortrait() {
  return (
    <svg viewBox="0 0 100 130" className="portrait-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 32 Q50 10 78 32 Q72 36 50 34 Q28 36 22 32 Z" fill="currentColor" opacity="0.9" />
      <path d="M35 32 Q50 20 65 32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <ellipse cx="50" cy="54" rx="13" ry="17" fill="currentColor" opacity="0.18" />
      <path d="M38 52 Q40 42 50 40 Q60 42 62 52 L62 60 Q60 68 50 69 Q40 68 38 60 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M40 48 L60 45 L60 50 L40 53 Z" fill="currentColor" opacity="0.8" />
      <path d="M44 63 Q50 65 56 63" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 130 Q22 95 38 86 L62 86 Q78 95 80 130 Z" fill="currentColor" opacity="0.22" />
      <path d="M42 86 L50 98 L58 86" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="50" cy="108" r="2" fill="currentColor" />
      <circle cx="50" cy="118" r="2" fill="currentColor" />
    </svg>
  )
}

function AssassinPortrait() {
  return (
    <svg viewBox="0 0 100 130" className="portrait-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 55 Q28 22 50 20 Q72 22 75 55 L75 70 Q50 62 25 70 Z" fill="currentColor" opacity="0.85" />
      <path d="M28 55 Q32 28 50 26 Q68 28 72 55" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="50" cy="58" rx="11" ry="12" fill="var(--parchment)" opacity="0.3" />
      <path d="M43 55 L47 54 L47 57 L43 58 Z" fill="currentColor" />
      <path d="M53 54 L57 55 L57 58 L53 57 Z" fill="currentColor" />
      <path d="M18 130 Q22 92 42 82 L58 82 Q78 92 82 130 Z" fill="currentColor" opacity="0.3" />
      <path d="M72 100 L78 82 L80 82 L76 102 Z" fill="currentColor" />
      <rect x="72" y="102" width="6" height="3" fill="currentColor" opacity="0.7" />
      <path d="M68 105 L82 105" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function AmbassadorPortrait() {
  return (
    <svg viewBox="0 0 100 130" className="portrait-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 32 Q50 12 72 32 L70 38 L30 38 Z" fill="currentColor" opacity="0.85" />
      <circle cx="50" cy="28" r="2.5" fill="currentColor" />
      <path d="M50 20 L50 28" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="50" cy="54" rx="13" ry="17" fill="currentColor" opacity="0.18" />
      <path d="M38 52 Q40 42 50 40 Q60 42 62 52 L62 60 Q60 68 50 69 Q40 68 38 60 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M42 62 Q50 92 58 62 Q56 78 50 84 Q44 78 42 62 Z" fill="currentColor" opacity="0.55" />
      <path d="M20 130 Q22 95 38 86 L62 86 Q78 95 80 130 Z" fill="currentColor" opacity="0.22" />
      <rect x="30" y="100" width="18" height="22" rx="2" fill="currentColor" opacity="0.5" />
      <path d="M30 104 L48 104 M30 110 L48 110 M30 116 L42 116" stroke="var(--parchment)" strokeWidth="0.8" opacity="0.8" />
    </svg>
  )
}

function ContessaPortrait() {
  return (
    <svg viewBox="0 0 100 130" className="portrait-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 50 Q28 22 50 18 Q72 22 74 50 Q74 40 68 36 Q60 50 50 50 Q40 50 32 36 Q26 40 26 50 Z" fill="currentColor" opacity="0.85" />
      <ellipse cx="50" cy="55" rx="13" ry="17" fill="currentColor" opacity="0.18" />
      <path d="M38 53 Q40 43 50 41 Q60 43 62 53 L62 62 Q60 70 50 71 Q40 70 38 62 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M46 64 Q50 67 54 64" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34 48 Q30 78 42 88" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
      <path d="M66 48 Q70 78 58 88" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
      <path d="M20 130 Q24 96 40 88 L60 88 Q76 96 80 130 Z" fill="currentColor" opacity="0.22" />
      <path d="M40 92 Q50 100 60 92" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="50" cy="100" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M47 100 L53 100 M50 97 L50 103" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

const PORTRAITS: Record<string, React.ComponentType> = {
  DUKE: DukePortrait,
  CAPTAIN: CaptainPortrait,
  ASSASSIN: AssassinPortrait,
  AMBASSADOR: AmbassadorPortrait,
  CONTESSA: ContessaPortrait,
}

const SIZE_MAP: Record<CardSize, string> = {
  xs: "xs",
  sm: "sm",
  md: "",
  lg: "lg",
}

/* ── Component ──────────────────────────────────────────────── */

interface CharacterCardProps {
  type: CardType | string
  revealed?: boolean
  showFace?: boolean
  size?: CardSize
  interactive?: boolean
  dealDelay?: number
  className?: string
}

export function CharacterCard({
  type,
  revealed = false,
  showFace = true,
  size = "md",
  interactive = false,
  dealDelay,
  className = "",
}: CharacterCardProps) {
  const char = CHARACTERS[type as string]
  const sizeClass = SIZE_MAP[size]
  const dealStyle = dealDelay != null ? { animationDelay: `${dealDelay}ms` } : {}

  if (!showFace || !char) {
    return (
      <div
        className={[
          "coup-card",
          sizeClass,
          dealDelay != null ? "deal-in" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={dealStyle}
      >
        <div className="card-back">
          <div className="back-crest">
            <div style={{ fontSize: size === "sm" || size === "xs" ? "18px" : "28px", color: "var(--gold)" }}>
              ❦
            </div>
            <div
              className="sc"
              style={{
                fontSize: size === "sm" || size === "xs" ? "7px" : "9px",
                color: "var(--gold)",
                letterSpacing: "0.3em",
              }}
            >
              COUP
            </div>
          </div>
        </div>
      </div>
    )
  }

  const Portrait = PORTRAITS[type as string]
  const isTiny = size === "sm" || size === "xs"

  return (
    <div
      className={[
        "coup-card",
        sizeClass,
        revealed ? "revealed" : "",
        interactive ? "interactive" : "",
        dealDelay != null ? "deal-in" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--house": char.color, ...dealStyle } as unknown as React.CSSProperties}
    >
      <div className="card-face">
        {/* Top-left corner */}
        <div className="card-corner tl">
          <div className="corner-initial" style={{ color: char.color }}>
            {char.initial}
          </div>
          <div className="corner-symbol" style={{ color: char.color }}>
            {char.symbol}
          </div>
        </div>

        {/* Bottom-right corner */}
        <div className="card-corner br">
          <div className="corner-initial" style={{ color: char.color }}>
            {char.initial}
          </div>
          <div className="corner-symbol" style={{ color: char.color }}>
            {char.symbol}
          </div>
        </div>

        {/* Center portrait + name */}
        <div className="card-center">
          {Portrait && (
            <div
              className="portrait"
              style={{ color: char.color, width: "100%", aspectRatio: "100/130", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Portrait />
            </div>
          )}
          {!isTiny ? (
            <>
              <div
                className="card-name-banner"
                style={{ borderColor: char.color, color: char.color }}
              >
                <span className="display">{char.name}</span>
              </div>
              <div
                className="card-subtitle sc"
                style={{ color: char.color, opacity: 0.75 }}
              >
                {char.subtitle}
              </div>
            </>
          ) : (
            <div
              className="card-name-banner tiny"
              style={{ borderColor: char.color, color: char.color }}
            >
              <span
                className="display"
                style={{ fontSize: size === "xs" ? "8px" : "10px" }}
              >
                {char.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
