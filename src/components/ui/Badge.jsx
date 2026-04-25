export function Badge({ children, blue = false }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      padding: '2px 8px',
      border: blue ? '1px solid #1a56ff' : '1px solid #0a0a0a',
      color: blue ? '#1a56ff' : '#0a0a0a',
      background: 'transparent',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}