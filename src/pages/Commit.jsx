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
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!user || !projectId) return
    setLoading(true); setError(''); setProgress(0)
    try {
      // Get the latest commit to carry forward its stems
      const { data: prevCommits } = await supabase
        .from('commits')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)

      const { data: commitRow, error: ce } = await supabase
        .from('commits')
        .insert({ project_id: projectId, user_id: user.id, message: message.trim() })
        .select().single()
      if (ce) throw ce

      // Carry forward stems from previous commit
      if (prevCommits?.[0]) {
        const { data: prevStems } = await supabase
          .from('stems')
          .select('*')
          .eq('commit_id', prevCommits[0].id)
        if (prevStems?.length) {
          await supabase.from('stems').insert(
            prevStems.map(s => ({
              commit_id: commitRow.id,
              project_id: projectId,
              uploaded_by: s.uploaded_by,
              filename: s.filename,
              storage_path: s.storage_path,
              file_size_bytes: s.file_size_bytes,
            }))
          )
        }
      }

      // Upload new stems on top
      for (let i = 0; i < files.length; i++) {
        await uploadStem(files[i], projectId, commitRow.id)
        setProgress(Math.round(((i + 1) / files.length) * 100))
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
        <div style={{ border: '2px solid var(--black)', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Dropzone onFiles={setFiles} />
          {files.length > 0 && (
            <div style={{ borderTop: '2px solid var(--black)', paddingTop: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '10px' }}>
                {files.length} file{files.length !== 1 ? 's' : ''} queued
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
        <div style={{ border: '2px solid var(--black)', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
              Describe this version
            </div>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Added 808, swapped snare, dropped tempo to 138"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && message.trim() && !loading) handleSubmit() }}
            />
          </div>

          {loading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)', marginBottom: '6px' }}>
                <span>Uploading stems...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--gray)', border: '1px solid var(--black)' }}>
                <div style={{ height: '100%', background: 'var(--blue)', width: `${progress}%`, transition: 'width 0.2s' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', marginTop: '6px' }}>
                {progress < 100 ? `${Math.round(progress / 100 * files.length)} of ${files.length} files` : 'Finalizing...'}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>← Back</Button>
            <Button variant="blue" onClick={handleSubmit} disabled={!message.trim() || loading}>
              {loading ? `Uploading ${progress}%` : 'Commit →'}
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
