interface FiligreeProps {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Filigree({ children, className = "", style }: FiligreeProps) {
  return (
    <div className={`filigree ${className}`} style={style}>
      <span className="ornament">❦</span>
      {children && (
        <span className="sc" style={{ fontSize: 10 }}>
          {children}
        </span>
      )}
      <span className="ornament">❦</span>
    </div>
  )
}
