export function CommentMarker({ timeSeconds, content }) {
  const mins = Math.floor(timeSeconds / 60)
  const secs = Math.floor(timeSeconds % 60).toString().padStart(2, '0')
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderLeft: '2px solid var(--blue)', paddingLeft: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--blue)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
        {mins}:{secs}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--black)', lineHeight: 1.4 }}>{content}</span>
    </div>
  )
}
