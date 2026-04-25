import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Landing() {
  const navigate = useNavigate()
  const { user, signInWithMagicLink, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setSending(true); setMessage(''); setError('')
    try {
      await signInWithMagicLink(email)
      setMessage('Magic link sent — check your inbox.')
    } catch (err) {
      setError(err.message || 'Could not send magic link')
    } finally { setSending(false) }
  }

  if (loading) return null

  return (
    <div>
      {/* Hero */}
      <div style={{ borderBottom: '2px solid var(--black)', paddingBottom: '56px', marginBottom: '56px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--gray-mid)', marginBottom: '24px' }}>
          Version Control for Music Producers
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(72px, 12vw, 140px)', lineHeight: 0.88, letterSpacing: '2px', marginBottom: '36px' }}>
          DEADW<span style={{ color: 'var(--blue)' }}>★</span>X
        </h1>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', maxWidth: '560px', lineHeight: 1.75, marginBottom: '48px', color: 'var(--black)' }}>
          The silent groove at the end of a record — where producers leave their mark.
          <br /><br />
          Deadwax is GitHub for beats. Commit versions, branch ideas, collaborate, and
          own every contribution on record. No more{' '}
          <span style={{ background: 'var(--black)', color: 'var(--cream)', padding: '1px 6px', fontFamily: 'var(--font-mono)' }}>final_FINAL_v3.wav</span>{' '}
          ever again.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '2px solid var(--black)', marginBottom: '48px', background: '#fff' }}>
          {[
            { num: '01', label: 'Commit History', desc: 'Every version saved, every stem tracked' },
            { num: '02', label: 'Branch Beats', desc: 'Fork a direction without losing the original' },
            { num: '03', label: 'Invite Collabs', desc: 'Share a link — they push stems directly' },
            { num: '04', label: 'Ownership Log', desc: 'Immutable proof of who built what and when' },
          ].map((f, i) => (
            <div
              key={f.label}
              style={{
                padding: '24px 20px',
                borderRight: i < 3 ? '2px solid var(--black)' : 'none',
                background: i % 2 === 0 ? '#fff' : 'var(--cream)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>{f.num}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '1px', marginBottom: '6px' }}>{f.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth */}
      <div style={{ maxWidth: '480px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '2px', marginBottom: '6px' }}>GET ACCESS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          No password. Just a magic link.
        </div>
        <form
          onSubmit={handleLogin}
          style={{ border: '2px solid var(--black)', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              type="email"
              placeholder="producer@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <Button type="submit" variant="blue" disabled={sending}>
              {sending ? '...' : 'Send Link'}
            </Button>
          </div>
          {message && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--blue)', borderLeft: '2px solid var(--blue)', paddingLeft: '10px' }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: '10px' }}>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
