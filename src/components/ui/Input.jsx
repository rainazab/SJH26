export function Input({ style = {}, ...props }) {
  return (
    <input
      style={{
        width: '100%',
        background: '#f0ece2',
        border: '2px solid #0a0a0a',
        color: '#0a0a0a',
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        outline: 'none',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = '#1a56ff'}
      onBlur={e => e.target.style.borderColor = '#0a0a0a'}
      {...props}
    />
  )
}