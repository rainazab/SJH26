export function CommentMarker({ timeSeconds, content }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderLeft: '2px solid #1a56ff', paddingLeft: '10px', marginTop: '6px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#1a56ff', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {Math.floor(timeSeconds / 60)}:{Math.floor(timeSeconds % 60).toString().padStart(2, '0')}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#0a0a0a' }}>{content}</span>
    </div>
  )
}