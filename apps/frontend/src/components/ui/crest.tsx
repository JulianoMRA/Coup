interface CrestProps {
  size?: number
  className?: string
}

export function Crest({ size = 42, className = "" }: CrestProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      style={{ color: "var(--gold-deep)" }}
      aria-hidden="true"
    >
      {/* shield */}
      <path
        d="M20 20 L80 20 L80 60 Q80 95 50 110 Q20 95 20 60 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M26 26 L74 26 L74 60 Q74 90 50 103 Q26 90 26 60 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* cross of swords */}
      <path d="M35 35 L65 85 M65 35 L35 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="60" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="60" r="2.5" fill="currentColor" />
      {/* flourishes */}
      <path d="M20 20 Q12 26 16 34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M80 20 Q88 26 84 34" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
