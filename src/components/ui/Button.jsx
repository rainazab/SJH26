export function Button({ children, variant = 'primary', ...props }) {
  const base = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    padding: '8px 16px',
    cursor: 'pointer',
  }
  const styles = {
    primary: { ...base, background: '#0a0a0a', color: '#f0ece2', border: '2px solid #0a0a0a' },
    secondary: { ...base, background: 'transparent', color: '#0a0a0a', border: '2px solid #0a0a0a' },
    blue: { ...base, background: '#1a56ff', color: '#fff', border: '2px solid #1a56ff' },
    danger: { ...base, background: 'transparent', color: '#e02020', border: '2px solid #e02020' },
  }
  return (
    <button
      style={{ ...styles[variant] || styles.primary, opacity: props.disabled ? 0.4 : 1, cursor: props.disabled ? 'not-allowed' : 'pointer' }}
      {...props}
    >
      {children}
    </button>
  )
}