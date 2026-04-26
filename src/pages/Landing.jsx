import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStems } from '../hooks/useStems'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Dropzone } from '../components/ui/Dropzone'
import { ProjectCard } from '../components/project/ProjectCard'
import { supabase } from '../lib/supabase'
import { generateToken } from '../lib/utils'

// ─── Logged-in: drop-first creator ────────────────────────────────────────────

function DropCreator({ user }) {
  const navigate = useNavigate()
  const { uploadStem } = useStems()

  const [files, setFiles] = useState([])
  const [projectName, setProjectName] = useState('')
  const [bpm, setBpm] = useState('')
  const [key, setKey] = useState('')
  const [genre, setGenre] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [recentProjects, setRecentProjects] = useState([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRecentProjects(data || []))
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!projectName.trim() || !files.length) return
    setSubmitting(true); setError(''); setProgress('')

    try {
      // 1. Create project
      const { data: project, error: pe } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          bpm: bpm ? Number(bpm) : null,
          key: key.trim() || null,
          genre: genre.trim() || null,
          owner_id: user.id,
          branch_name: 'main',
          invite_token: generateToken(),
        })
        .select()
        .single()
      if (pe) throw pe

      // 2. Create initial commit
      const { data: commit, error: ce } = await supabase
        .from('commits')
        .insert({ project_id: project.id, user_id: user.id, message: 'Initial commit' })
        .select()
        .single()
      if (ce) throw ce

      // 3. Upload each stem
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1}/${files.length} stems...`)
        await uploadStem(files[i], project.id, commit.id)
      }

      navigate(`/project/${project.id}`)
    } catch (err) {
      console.error('[drop-create]', err)
      setError(err.message || 'Something went wrong')
      setSubmitting(false)
      setProgress('')
    }
  }

  const canSubmit = files.length > 0 && projectName.trim().length > 0 && !submitting

  return (
    <div>
      {/* Drop creator */}
      <div style={{ borderBottom: '2px solid var(--black)', paddingBottom: '48px', marginBottom: '48px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--gray-mid)', marginBottom: '16px' }}>
          New Project
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 0.9, letterSpacing: '2px', marginBottom: '32px' }}>
          DROP YOUR<br /><span style={{ color: 'var(--blue)' }}>STEMS</span>
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dropzone */}
          <Dropzone onFiles={setFiles} />

          {/* File list */}
          {files.length > 0 && (
            <div style={{ border: '2px solid var(--black)', background: '#fff' }}>
              <div style={{ borderBottom: '2px solid var(--black)', padding: '8px 14px', background: 'var(--black)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--cream)' }}>
                  {files.length} file{files.length !== 1 ? 's' : ''} queued
                </span>
              </div>
              {files.map((f) => (
                <div
                  key={`${f.name}-${f.size}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--gray)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                >
                  <span><span style={{ color: 'var(--blue)', marginRight: '8px' }}>◈</span>{f.name}</span>
                  <span style={{ color: 'var(--gray-mid)', flexShrink: 0, marginLeft: '16px' }}>
                    {(f.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Project metadata */}
          <div style={{ border: '2px solid var(--black)', padding: '20px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>
                Project Name *
              </div>
              <Input
                placeholder="e.g. Late Night Sessions"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>BPM</div>
                <Input placeholder="140" value={bpm} onChange={(e) => setBpm(e.target.value)} type="number" min="40" max="300" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Key</div>
                <Input placeholder="Fm" value={key} onChange={(e) => setKey(e.target.value)} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '6px' }}>Genre</div>
                <Input placeholder="Trap" value={genre} onChange={(e) => setGenre(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--blue)', borderLeft: '2px solid var(--blue)', paddingLeft: '12px' }}>
              {progress}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', background: 'rgba(224,32,32,0.06)', border: '2px solid var(--red)', padding: '10px 14px' }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="blue" disabled={!canSubmit} style={{ alignSelf: 'flex-start' }}>
            {submitting ? progress || 'Working...' : `Drop stems + create project →`}
          </Button>
        </form>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '16px' }}>
            Recent Projects
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', border: '2px solid var(--black)' }}>
            {recentProjects.map((project) => (
              <div key={project.id} style={{ borderRight: '2px solid var(--black)', borderBottom: '2px solid var(--black)', marginRight: '-2px', marginBottom: '-2px' }}>
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Logged-out: hero + magic link ────────────────────────────────────────────

function HeroLogin() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setSending(true); setMessage(''); setError('')
    try {
      await signInWithMagicLink(email)
      setMessage('Magic link sent — check your inbox and click the link.')
    } catch (err) {
      console.error('[login]', err)
      setError(err.message || 'Could not send magic link')
    } finally { setSending(false) }
  }

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
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--blue)', background: 'rgba(26,86,255,0.06)', border: '2px solid var(--blue)', padding: '12px 14px' }}>
              ✓ {message}
            </div>
          )}
          {error && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--red)', background: 'rgba(224,32,32,0.06)', border: '2px solid var(--red)', padding: '12px 14px' }}>
              Error: {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ─── Root export ───────────────────────────────────────────────────────────────

export function Landing() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <DropCreator user={user} /> : <HeroLogin />
}
