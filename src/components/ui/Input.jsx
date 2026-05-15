export function Input({ style = {}, ...props }) {
  return (
    <input
      style={{
        width: '100%',
        background: 'var(--surface-2)',
        border: '2px solid var(--black)',
        color: 'var(--black)',
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        outline: 'none',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = '#1a56ff'}
      onBlur={e => e.target.style.borderColor = '#f0ece2'}
      {...props}
    />
  )
}