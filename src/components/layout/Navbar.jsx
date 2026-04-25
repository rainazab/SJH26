import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Navbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header style={{ borderBottom: '2px solid var(--black)', background: 'var(--black)' }}>
      <nav style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
        <Link to={user ? '/dashboard' : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#f0ece2', letterSpacing: '3px', lineHeight: 1 }}>DEADW</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--blue)', letterSpacing: '0', lineHeight: 1 }}>★</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#f0ece2', letterSpacing: '3px', lineHeight: 1 }}>X</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          {user ? (
            <>
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
            <Link to="/" style={{ color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>Login</Link>
          )}
        </div>
      </nav>
    </header>
  )
}
