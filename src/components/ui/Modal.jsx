import { useEffect } from 'react'

export function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,10,0.75)', padding: '24px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--surface)', border: '2px solid var(--black)', padding: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--black)', padding: '14px 20px', background: 'var(--surface-2)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px', color: 'var(--black)' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-mid)', fontSize: '20px', lineHeight: 1, padding: '0 2px' }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
