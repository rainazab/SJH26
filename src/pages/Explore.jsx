import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Badge } from '../components/ui/Badge'

export function Explore() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('*, profiles!owner_id(username, display_name, avatar_url)')
      .is('parent_project_id', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects(data || [])
        setLoading(false)
      })
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: projects.length ? '2px solid var(--black)' : 'none' }}>
        {projects.map((project, i) => {
          const profile = project.profiles
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
                  : <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gray-mid)' }}>?</span>
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
