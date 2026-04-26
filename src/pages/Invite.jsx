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
    <div style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--blue)', marginBottom: '8px' }}>
          ⬡ Collaboration Invite
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>YOU'RE IN</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gray-mid)', marginTop: '8px' }}>
          Someone wants to build with you.
        </div>
      </div>

      <div style={{ border: '2px solid var(--black)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        {/* Project info banner */}
        {!loadingProject && project && (
          <div style={{ borderBottom: '2px solid var(--black)', padding: '20px 28px', background: 'var(--black)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>
              Project
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '2px', color: 'var(--cream)' }}>{project.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '6px', display: 'flex', gap: '16px' }}>
              {project.bpm && <span>{project.bpm} BPM</span>}
              {project.key && <span>{project.key}</span>}
              {project.genre && <span>{project.genre}</span>}
            </div>
          </div>
        )}

        {loadingProject && (
          <div style={{ padding: '28px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Loading project...
          </div>
        )}

        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* What happens next */}
          {!loadingProject && project && !error && (
            <div style={{ border: '1px solid var(--gray)', padding: '14px', background: 'var(--cream)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '10px' }}>
                What happens next
              </div>
              {['Sign in below (magic link, no password)', 'You join the project as a collaborator', 'Drop your stems — drums, bass, melodies', 'Every contribution is logged with your name'].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--blue)', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: '16px' }}>{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {!loadingProject && !user && !error && (
            <form
              onSubmit={async (e) => {
                e.preventDefault(); setError('')
                try {
                  await signInWithMagicLink(email)
                  setMessage("Check your inbox — click the link, then you'll land right back here and join automatically.")
                } catch (err) { setError(err.message) }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)' }}>
                Your email
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="producer@email.com" required style={{ flex: 1 }} />
                <Button type="submit" variant="blue">Get Link</Button>
              </div>
            </form>
          )}

          {!loadingProject && user && project && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)' }}>
                Signed in as <span style={{ color: 'var(--black)' }}>{user.email}</span>
              </div>
              <Button variant="blue" onClick={join} disabled={joining}>
                {joining ? 'Joining...' : `Join ${project.name} →`}
              </Button>
            </div>
          )}

          {message && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--blue)', background: 'rgba(26,86,255,0.06)', border: '2px solid var(--blue)', padding: '12px 14px', lineHeight: 1.6 }}>
              ✓ {message}
            </div>
          )}
          {error && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: '10px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
