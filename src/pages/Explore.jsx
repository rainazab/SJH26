import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Badge } from '../components/ui/Badge'

export function Explore() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setError('')
      const { data: projectData, error: pe } = await supabase
        .from('projects')
        .select('*')
        .is('parent_project_id', null)
        .order('created_at', { ascending: false })

      if (pe) { setError(pe.message); setLoading(false); return }
      if (!projectData?.length) { setProjects([]); setLoading(false); return }

      const ownerIds = [...new Set(projectData.map(p => p.owner_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', ownerIds)

      const profileMap = {}
      for (const p of profiles || []) profileMap[p.id] = p

      setProjects(projectData.map(p => ({ ...p, profile: profileMap[p.owner_id] || null })))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '32px', borderBottom: '2px solid var(--black)', paddingBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px' }}>Open Source Beats</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '2px', lineHeight: 1 }}>EXPLORE</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray-mid)', marginTop: '8px' }}>
          Every project is open to contributions. Drop stems on any beat.
        </div>
      </div>

      {loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)' }}>Loading...</div>}
      {error && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>{error}</div>}

      {!loading && !error && projects.length === 0 && (
        <div style={{ border: '2px dashed var(--gray)', padding: '80px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '12px' }}>NO PROJECTS YET</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray-mid)' }}>Be the first to drop a beat.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', border: projects.length ? '2px solid var(--black)' : 'none' }}>
        {projects.map((project, i) => {
          const profile = project.profile
          return (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 20px', borderBottom: i < projects.length - 1 ? '2px solid var(--black)' : 'none', cursor: 'pointer', background: '#fff', transition: 'background 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >
              <div style={{ width: '40px', height: '40px', border: '2px solid var(--black)', flexShrink: 0, overflow: 'hidden', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gray-mid)' }}>
                      {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
                    </span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '1px', lineHeight: 1, marginBottom: '4px' }}>{project.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)' }}>
                  by {profile?.display_name || profile?.username || 'unknown'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {project.bpm && <Badge>{project.bpm} BPM</Badge>}
                {project.key && <Badge>{project.key}</Badge>}
                {project.genre && <Badge>{project.genre}</Badge>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--blue)', flexShrink: 0 }}>
                Contribute →
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}