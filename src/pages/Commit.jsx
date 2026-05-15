import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Dropzone } from '../components/ui/Dropzone'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useStems } from '../hooks/useStems'
import { formatFileSize } from '../lib/utils'
import { supabase } from '../lib/supabase'

export function Commit() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { uploadStem } = useStems()
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!user || !projectId) return
    setLoading(true); setError(''); setProgress(0); setProgressLabel('')

    try {
      // 1. Get the latest commit so we can carry its stems forward
      const { data: prevCommits } = await supabase
        .from('commits')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)

      const prevCommitId = prevCommits?.[0]?.id || null

      // 2. Fetch previous stems if they exist
      let prevStems = []
      if (prevCommitId) {
        const { data } = await supabase
          .from('stems')
          .select('*')
          .eq('commit_id', prevCommitId)
        prevStems = data || []
      }

      // 3. Create the new commit row
      setProgressLabel('Creating commit...')
      const { data: commitRow, error: ce } = await supabase
        .from('commits')
        .insert({ project_id: projectId, user_id: user.id, message: message.trim() })
        .select().single()
      if (ce) throw ce

      // 4. Copy previous stems into the new commit, preserving original uploader
      if (prevStems.length) {
        setProgressLabel('Stacking previous stems...')
        const { error: copyError } = await supabase.from('stems').insert(
          prevStems.map(s => ({
            commit_id: commitRow.id,
            project_id: projectId,
            uploaded_by: s.uploaded_by,
            filename: s.filename,
            storage_path: s.storage_path,
            file_size_bytes: s.file_size_bytes,
          }))
        )
        if (copyError) throw copyError
      }

      // 5. Upload the new stems on top
      const totalNew = files.length
      for (let i = 0; i < totalNew; i++) {
        setProgressLabel(`Uploading ${files[i].name}...`)
        await uploadStem(files[i], projectId, commitRow.id)
        setProgress(Math.round(((i + 1) / totalNew) * 100))
      }

      navigate(`/project/${projectId}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
          <Link to={`/project/${projectId}`} style={{ color: 'var(--gray-mid)', textDecoration: 'none' }}>← Project</Link>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>NEW COMMIT</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '8px' }}>
          Your new stems will be stacked on top of all previous stems.
        </div>
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', marginBottom: '24px', border: '2px solid var(--black)' }}>
        {['01 · Upload Stems', '02 · Write Message'].map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1, padding: '10px 16px',
              background: step === i + 1 ? 'var(--black)' : 'transparent',
              color: step === i + 1 ? 'var(--cream)' : 'var(--gray-mid)',
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '1px',
              borderRight: i === 0 ? '2px solid var(--black)' : 'none',
            }}
          >
            {s}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div style={{ border: '2px solid var(--black)', padding: '24px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Dropzone onFiles={setFiles} />
          {files.length > 0 && (
            <div style={{ borderTop: '2px solid var(--black)', paddingTop: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '10px' }}>
                {files.length} new stem{files.length !== 1 ? 's' : ''} to add
              </div>
              {files.map((f) => (
                <div
                  key={`${f.name}-${f.size}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--blue)' }}>◈</span> {f.name}
                  </span>
                  <span style={{ color: 'var(--gray-mid)', flexShrink: 0, marginLeft: '16px' }}>{formatFileSize(f.size)}</span>
                </div>
              ))}
            </div>
          )}
          <Button variant="blue" onClick={() => setStep(2)} disabled={!files.length}>
            Continue →
          </Button>
        </div>
      ) : (
        <div style={{ border: '2px solid var(--black)', padding: '24px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
              Describe what you added
            </div>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Added bass layer"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && message.trim() && !loading) handleSubmit() }}
            />
          </div>

          {loading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)', marginBottom: '6px' }}>
                <span>{progressLabel || 'Working...'}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--gray)', border: '1px solid var(--black)' }}>
                <div style={{ height: '100%', background: 'var(--blue)', width: `${progress}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>← Back</Button>
            <Button variant="blue" onClick={handleSubmit} disabled={!message.trim() || loading}>
              {loading ? progressLabel || 'Working...' : 'Commit →'}
            </Button>
          </div>

          {error && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: '10px' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}