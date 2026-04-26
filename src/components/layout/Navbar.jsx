import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function Navbar() {
  const navigate = useNavigate()
  const { user, signOut, signInWithMagicLink, signInWithGoogle } = useAuth()
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
            <button
              type="button"
              onClick={async () => { try { await signInWithGoogle() } catch (err) { setError(err.message) } }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: '#fff', border: '2px solid var(--black)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--gray)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--gray)' }} />
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Magic link (email)
            </div>
            <Input type="email" placeholder="producer@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
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
