import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Invite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, signInWithMagicLink } = useAuth()
  const [project, setProject] = useState(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [joining, setJoining] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    supabase.from('projects').select('*').eq('invite_token', token).single()
      .then(({ data, error: e }) => {
        if (e || !data) setError('Invite link not found or already expired.')
        else setProject(data)
        setLoadingProject(false)
      })
  }, [token])

  const join = async () => {
    if (!user || !project) return
    setJoining(true); setError('')
    const { error: e } = await supabase.from('collaborators').upsert(
      { project_id: project.id, user_id: user.id, role: 'contributor' },
      { onConflict: 'project_id,user_id' }
    )
    if (e) { setError(e.message); setJoining(false); return }
    navigate(`/project/${project.id}`)
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
          Collaboration Invite
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>JOIN PROJECT</h1>
      </div>

      <div style={{ border: '2px solid var(--black)', padding: '28px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loadingProject && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Looking up invite...
          </div>
        )}

        {!loadingProject && project && (
          <div style={{ borderBottom: '2px solid var(--black)', paddingBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>
              You've been invited to collaborate on
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', letterSpacing: '2px' }}>{project.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '6px' }}>
              {[project.bpm && `${project.bpm} BPM`, project.key, project.genre].filter(Boolean).join(' · ')}
            </div>
          </div>
        )}

        {!loadingProject && !user && !error && (
          <form
            onSubmit={async (e) => {
              e.preventDefault(); setError('')
              try {
                await signInWithMagicLink(email)
                setMessage('Check your inbox — then open this invite link again.')
              } catch (err) { setError(err.message) }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Sign in first to join
            </div>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
            <Button type="submit" variant="blue">Send Magic Link</Button>
          </form>
        )}

        {!loadingProject && user && project && (
          <Button variant="blue" onClick={join} disabled={joining}>
            {joining ? 'Joining...' : 'Join as Collaborator'}
          </Button>
        )}

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
      </div>
    </div>
  )
}
