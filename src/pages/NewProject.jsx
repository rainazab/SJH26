import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { generateToken } from '../lib/utils'

export function NewProject() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [bpm, setBpm] = useState('')
  const [musicKey, setMusicKey] = useState('')
  const [genre, setGenre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true); setError('')
    try {
      const { data, error: err } = await supabase.from('projects').insert({
        name: name.trim(),
        bpm: bpm ? Number(bpm) : null,
        key: musicKey.trim() || null,
        genre: genre.trim() || null,
        owner_id: user.id,
        branch_name: 'main',
        invite_token: generateToken(),
        is_private: true,
      }).select().single()
      if (err) throw err
      navigate(`/project/${data.id}`)
    } catch (err) {
      setError(err.message || 'Could not create project')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
          <Link to="/dashboard" style={{ color: 'var(--gray-mid)', textDecoration: 'none' }}>← Dashboard</Link>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>NEW PROJECT</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>
          Initialize a new beat repository
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ border: '2px solid var(--black)', padding: '28px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Project Name *</div>
          <Input
            placeholder="e.g. Late Night Sessions"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>BPM</div>
            <Input
              placeholder="140"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              type="number"
              min="40"
              max="300"
            />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Key</div>
            <Input
              placeholder="Fm"
              value={musicKey}
              onChange={(e) => setMusicKey(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Genre</div>
            <Input
              placeholder="Trap"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--gray)', paddingTop: '16px', display: 'flex', gap: '8px' }}>
          <Button type="submit" variant="blue" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Init Project'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
        </div>

        {error && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: '10px' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  )
}
