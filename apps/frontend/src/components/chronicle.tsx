interface ChronicleProps {
  log: string[]
}

export function Chronicle({ log }: ChronicleProps) {
  return (
    <aside className="chronicle">
      <div className="chronicle-title">Crônica da Partida</div>
      <div className="chronicle-list">
        {log.length === 0 ? (
          <div className="chronicle-item" style={{ opacity: 0.5, fontStyle: "italic" }}>
            Nenhuma ação ainda.
          </div>
        ) : (
          [...log].reverse().map((entry, i) => (
            <div key={i} className="chronicle-item">
              <span className="tstamp">›</span>
              <span>{entry}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
