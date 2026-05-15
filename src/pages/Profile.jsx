import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'

export function Profile() {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('username').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.username) setUsername(data.username)
      })
  }, [user])

  const save = async (e) => {
    e.preventDefault()
    if (!user || !username.trim()) return
    setSaving(true); setError(''); setSaved(false)
    try {
      const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: clean,
      })
      if (upsertError) throw upsertError
      setUsername(clean)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px' }}>Account</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>PROFILE</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Pick your handle — this is how your commits are signed.
        </div>
      </div>

      <form onSubmit={save} style={{ border: '2px solid var(--black)', background: 'var(--surface)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Username</div>
          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--black)', background: 'var(--surface-2)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '8px 10px', borderRight: '2px solid var(--black)', color: 'var(--gray-mid)', flexShrink: 0 }}>@</span>
            <input
              style={{ flex: 1, background: 'transparent', color: 'var(--black)', border: 'none', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }}
              placeholder="yourhandle"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              required
              autoFocus
            />
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--gray)', paddingTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button type="submit" variant="blue" disabled={saving || !username.trim()}>
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Profile'}
          </Button>
          {error && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
        </div>
      </form>
    </div>
  )
}
