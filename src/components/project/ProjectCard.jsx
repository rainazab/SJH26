import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'

export function ProjectCard({ project }) {
  const isMain = !project.branch_name || project.branch_name === 'main'

  return (
    <Link
      to={`/project/${project.id}`}
      style={{ display: 'block', padding: '20px', textDecoration: 'none', color: 'inherit', background: '#fff', transition: 'background 0.1s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cream)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '1px', lineHeight: 1, wordBreak: 'break-word' }}>
          {project.name}
        </h3>
        {!isMain && (
          <Badge blue>{project.branch_name}</Badge>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {project.bpm && <Badge>{project.bpm} BPM</Badge>}
        {project.key && <Badge>{project.key}</Badge>}
        {project.genre && <Badge>{project.genre}</Badge>}
        {(!project.bpm && !project.key && !project.genre) && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            No metadata
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </Link>
  )
}
