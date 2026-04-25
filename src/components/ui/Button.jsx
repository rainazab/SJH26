export function Button({ children, variant = 'primary', ...props }) {
  const base = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'opacity 0.1s',
  }
  const styles = {
    primary: { ...base, background: 'var(--black)', color: 'var(--cream)', border: '2px solid var(--black)' },
    secondary: { ...base, background: 'transparent', color: 'var(--black)', border: '2px solid var(--black)' },
    blue: { ...base, background: 'var(--blue)', color: '#fff', border: '2px solid var(--blue)' },
    danger: { ...base, background: 'transparent', color: 'var(--red)', border: '2px solid var(--red)' },
  }
  return (
    <button
      style={{
        ...(styles[variant] || styles.primary),
        opacity: props.disabled ? 0.35 : 1,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
      }}
      {...props}
    >
      {children}
    </button>
  )
}
