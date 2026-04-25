import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProjectCard } from '../components/project/ProjectCard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true); setError('')
      const { data: owned, error: ownedErr } = await supabase
        .from('projects').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      if (ownedErr) { setError(ownedErr.message); setLoading(false); return }
      const { data: collabs } = await supabase.from('collaborators').select('project_id').eq('user_id', user.id)
      const ids = (collabs || []).map(c => c.project_id)
      if (!ids.length) { setProjects(owned || []); setLoading(false); return }
      const { data: shared } = await supabase.from('projects').select('*').in('id', ids)
      const merged = [...(owned || []), ...(shared || [])]
      const unique = Array.from(new Map(merged.map(p => [p.id, p])).values())
      unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setProjects(unique)
      setLoading(false)
    }
    load().catch(e => { setError(e.message); setLoading(false) })
  }, [user])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px' }}>
            Your Repositories — {projects.length}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>DASHBOARD</h1>
        </div>
        <Button variant="blue" onClick={() => navigate('/new')}>+ New Project</Button>
      </div>

      {error && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: '10px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)' }}>
          Loading...
        </div>
      )}

      {!loading && !error && !projects.length && (
        <div style={{ border: '2px dashed var(--gray)', padding: '80px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '12px' }}>NO PROJECTS YET</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '24px' }}>Initialize your first beat repository</div>
          <Button variant="blue" onClick={() => navigate('/new')}>Create First Project</Button>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', border: '2px solid var(--black)' }}>
          {projects.map((project) => (
            <div key={project.id} style={{ borderRight: '2px solid var(--black)', borderBottom: '2px solid var(--black)', marginRight: '-2px', marginBottom: '-2px' }}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
