import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function Navbar() {
  const navigate = useNavigate()
  const { user, signOut, signInWithMagicLink } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setSending(true); setMessage(''); setError('')
    try {
      await signInWithMagicLink(email)
      setMessage('Check your inbox and click the link to sign in.')
    } catch (err) {
      console.error('[login]', err)
      setError(err.message || 'Could not send magic link')
    } finally {
      setSending(false)
    }
  }

  const handleModalClose = () => {
    setIsLoginOpen(false)
    setEmail(''); setMessage(''); setError('')
  }

  return (
    <>
      <header style={{ borderBottom: '2px solid var(--black)', background: 'var(--black)' }}>
        <nav style={{ padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', width: '100%', boxSizing: 'border-box' }}>
          <Link to={user ? '/dashboard' : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Deadwax" style={{ height: '32px', width: 'auto', display: 'block' }} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            {user ? (
              <>
                <Link to="/explore" style={{ color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>
                  Explore
                </Link>
                <Link to="/profile" style={{ color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>
                  Profile
                </Link>
                <Link to="/dashboard" style={{ color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>
                  Dashboard
                </Link>
                <span style={{ color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{ border: '1px solid #444', color: 'var(--gray)', background: 'transparent', padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                style={{ border: '1px solid #444', color: 'var(--gray)', background: 'transparent', padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}
              >
                Login
              </button>
            )}
          </div>
        </nav>
      </header>

      <Modal open={isLoginOpen} onClose={handleModalClose} title="SIGN IN">
        {message ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--blue)', background: 'rgba(26,86,255,0.06)', border: '2px solid var(--blue)', padding: '14px 16px', lineHeight: 1.5 }}>
              ✓ {message}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              After clicking the link you'll be signed in automatically.
            </div>
            <Button variant="secondary" onClick={handleModalClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              No password. Enter your email, get a magic link.
            </div>
            <Input
              type="email"
              placeholder="producer@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" variant="blue" disabled={sending}>
              {sending ? 'Sending...' : 'Send Magic Link'}
            </Button>
            {error && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', background: 'rgba(224,32,32,0.06)', border: '2px solid var(--red)', padding: '10px 12px' }}>
                {error}
              </div>
            )}
          </form>
        )}
      </Modal>
    </>
  )
}
