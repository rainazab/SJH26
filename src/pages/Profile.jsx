import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Profile() {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        setDisplayName(data.display_name || '')
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || '')
      })
  }, [user])

  const uploadAvatar = async (file) => {
    if (!user) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const save = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        avatar_url: avatarUrl,
      })
      if (upsertError) throw upsertError
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
      </div>

      <form onSubmit={save} style={{ border: '2px solid var(--black)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '2px solid var(--black)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: '72px', height: '72px', border: '2px solid var(--black)', cursor: 'pointer', flexShrink: 0, overflow: 'hidden', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--gray-mid)' }}>?</span>
            }
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#fff', textTransform: 'uppercase' }}>...</span>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Profile Photo</div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', background: 'transparent', border: '2px solid var(--black)', padding: '4px 12px', cursor: 'pointer' }}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Display Name</div>
            <Input placeholder="Lil Producer" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Username</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--black)', background: 'var(--cream)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '8px 10px', borderRight: '2px solid var(--black)', color: 'var(--gray-mid)', flexShrink: 0 }}>@</span>
              <input
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }}
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--gray)', paddingTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button type="submit" variant="blue" disabled={saving}>
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Profile'}
            </Button>
            {error && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
          </div>
        </div>
      </form>
    </div>
  )
}
