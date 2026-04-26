import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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
  const [uploadedCount, setUploadedCount] = useState(0)
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
    setSubmitting(true); setError(''); setProgress(''); setUploadedCount(0)

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
        setProgress(`Uploading stem ${i + 1} of ${files.length}`)
        await uploadStem(files[i], project.id, commit.id)
        setUploadedCount(i + 1)
      }
      setProgress('Finalizing...')

      navigate(`/project/${project.id}`)
    } catch (err) {
      console.error('[drop-create]', err)
      setError(err.message || 'Something went wrong')
      setSubmitting(false)
      setProgress(''); setUploadedCount(0)
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
          {submitting && (
            <div style={{ border: '2px solid var(--black)', padding: '16px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
                <span>{progress || 'Creating project...'}</span>
                {files.length > 0 && uploadedCount > 0 && (
                  <span>{uploadedCount}/{files.length}</span>
                )}
              </div>
              <div style={{ height: '6px', background: 'var(--gray)', border: '1px solid var(--black)' }}>
                <div style={{
                  height: '100%',
                  background: 'var(--blue)',
                  transition: 'width 0.3s ease',
                  width: submitting
                    ? progress.includes('of')
                      ? `${Math.round((parseInt(progress.match(/\d+/)?.[0]) / files.length) * 100)}%`
                      : progress === 'Finalizing...' ? '95%' : '5%'
                    : '0%',
                }} />
              </div>
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
  const { signInWithMagicLink, signInWithGoogle } = useAuth()
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
      {/* ── Hero ── */}
      <div style={{ borderBottom: '2px solid var(--black)', paddingBottom: '64px', marginBottom: '56px' }}>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--gray-mid)', marginBottom: '20px' }}>
          For Independent Producers
        </div>

        <h1 style={{ marginBottom: '20px', lineHeight: 1 }}>
          <img src="/logo-black.png" alt="Deadwax" style={{ height: 'clamp(72px, 12vw, 140px)', width: 'auto', display: 'block' }} />
        </h1>

        {/* Secondary headline */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3.5vw, 36px)', letterSpacing: '2px', lineHeight: 1.05, marginBottom: '40px' }}>
          YOUR STEMS.{' '}
          <span style={{ color: 'var(--blue)' }}>YOUR CREDIT.</span>
          <br />
          ON RECORD — FOREVER.
        </div>

        {/* Problem statement */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', maxWidth: '600px', lineHeight: 1.8, marginBottom: '40px', color: 'var(--black)' }}>
          The beat drops. The collab claims it. You have nothing but a DM thread and a{' '}
          <span style={{ background: 'var(--black)', color: 'var(--cream)', padding: '1px 6px' }}>final_FINAL_v3.wav</span>
          {' '}nobody can trace back to you.
          <br /><br />
          Independent producers lose credit, get locked into expensive platforms, and have no
          proof of who built what — or when. Deadwax fixes that.
          Open, accessible, and built so your creative work is yours from the first drop.
        </p>

        {/* Manifesto bar */}
        <div style={{ background: 'var(--black)', color: 'var(--cream)', padding: '20px 28px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', border: '2px solid var(--black)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2.5vw, 26px)', letterSpacing: '2px', lineHeight: 1 }}>
            BUILT FOR PRODUCERS. NOT PLATFORMS.
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', whiteSpace: 'nowrap' }}>
            Free · Open · Yours
          </span>
        </div>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '2px solid var(--black)', marginBottom: '24px' }}>
          {[
            {
              num: '01',
              label: 'Tamper-Proof Commits',
              desc: 'Every version timestamped and attributed. No one rewrites history.',
            },
            {
              num: '02',
              label: 'Fork Without Fear',
              desc: "Your direction stays yours. Branch into new ideas — the original is locked.",
            },
            {
              num: '03',
              label: 'No Account Walls',
              desc: 'One invite link. Any device. Every collaborator on record the second they join.',
            },
            {
              num: '04',
              label: 'Receipts Forever',
              desc: 'Immutable ownership log. Every upload, every commit, who and exactly when.',
            },
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
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '1px', marginBottom: '8px', lineHeight: 1.05 }}>{f.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Security strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '2px solid var(--black)', borderTop: 'none' }}>
          {[
            { icon: '◈', label: 'Magic link auth', sub: 'No passwords. No friction.' },
            { icon: '◎', label: 'Signed storage URLs', sub: 'Files never publicly exposed.' },
            { icon: '◉', label: 'Immutable event log', sub: 'Cannot be edited or deleted.' },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '14px 20px',
                borderRight: i < 2 ? '2px solid var(--black)' : 'none',
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#fff',
              }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--blue)', flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--black)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', marginTop: '2px' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Auth ── */}
      <div style={{ maxWidth: '480px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', letterSpacing: '2px', marginBottom: '6px' }}>
          GET ACCESS
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          No password. No subscription. Just a magic link.
        </div>
        <form
          onSubmit={handleLogin}
          style={{ border: '2px solid var(--black)', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
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
  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)', padding: '60px 0' }}>
      Loading...
    </div>
  )
  if (user) return <Navigate to="/dashboard" replace />
  return <HeroLogin />
}
