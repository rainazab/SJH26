import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OwnershipLog } from '../components/project/OwnershipLog'
import { supabase } from '../lib/supabase'

export function Log() {
  const { id: projectId } = useParams()
  const [entries, setEntries] = useState([])
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!projectId) return
    async function load() {
      setLoading(true); setError('')
      try {
        const [projRes, commitsRes, stemsRes, commentsRes] = await Promise.all([
          supabase.from('projects').select('name').eq('id', projectId).single(),
          supabase.from('commits').select('*').eq('project_id', projectId),
          supabase.from('stems').select('*').eq('project_id', projectId),
          supabase.from('comments').select('*, stems!inner(project_id, filename)').eq('stems.project_id', projectId),
        ])
        if (projRes.data) setProjectName(projRes.data.name)
        const timeline = [
          ...(commitsRes.data || []).map(c => ({
            id: `commit-${c.id}`,
            text: `Commit — "${c.message}"`,
            created_at: c.created_at,
          })),
          ...(stemsRes.data || []).map(s => ({
            id: `stem-${s.id}`,
            text: `Stem uploaded — ${s.filename}`,
            created_at: s.created_at,
          })),
          ...(commentsRes.data || []).map(c => ({
            id: `comment-${c.id}`,
            text: `Comment pinned at ${Math.floor(c.time_seconds / 60)}:${Math.floor(c.time_seconds % 60).toString().padStart(2, '0')} on ${c.stems?.filename || 'stem'}`,
            created_at: c.created_at,
          })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setEntries(timeline)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  return (
    <div>
      <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
          <Link to={`/project/${projectId}`} style={{ color: 'var(--gray-mid)', textDecoration: 'none' }}>← {projectName || 'Project'}</Link>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>OWNERSHIP LOG</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Immutable record — cannot be edited or deleted — {entries.length} events
        </div>
      </div>

      {loading && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)' }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: '10px' }}>
          {error}
        </div>
      )}
      {!loading && !error && <OwnershipLog entries={entries} />}
    </div>
  )
}
