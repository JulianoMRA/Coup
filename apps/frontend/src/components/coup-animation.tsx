"use client"

export function CoupAnimation() {
  return (
    <div
      className="dramatic-backdrop"
      style={{
        pointerEvents: "none",
        background: "radial-gradient(ellipse at center, oklch(0 0 0 / 0.4), oklch(0.22 0.15 25 / 0.5))",
      }}
    >
      <div style={{ position: "relative", width: "60%", height: 200 }}>
        <div className="slash-effect" />
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-display)",
            fontSize: 72,
            letterSpacing: "0.2em",
            color: "var(--parchment)",
            textShadow: "0 0 30px oklch(0.35 0.16 25 / 0.8)",
          }}
        >
          GOLPE
        </div>
      </div>
    </div>
  )
}
