import { formatRelativeDate } from '../../lib/utils'

export function CommitTimeline({ commits, selectedCommitId, onSelectCommit }) {
  if (!commits.length) return (
    <div style={{ border: '2px dashed var(--gray)', padding: '20px', textAlign: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>No commits yet</span>
    </div>
  )

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--gray)' }}>
        Commit Log — {commits.length}
      </div>
      {commits.map((commit, i) => {
        const selected = selectedCommitId === commit.id
        return (
          <button
            key={commit.id}
            onClick={() => onSelectCommit(commit.id)}
            title={new Date(commit.created_at).toLocaleString()}
            style={{
              background: selected ? 'var(--black)' : 'transparent',
              color: selected ? 'var(--cream)' : 'var(--black)',
              border: 'none',
              borderLeft: selected ? '3px solid var(--blue)' : '3px solid transparent',
              borderBottom: '1px solid var(--gray)',
              padding: '10px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'rgba(26,86,255,0.06)' }}
            onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '3px', wordBreak: 'break-word', lineHeight: 1.4 }}>
              {commit.message || '(no message)'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: selected ? 'var(--gray)' : 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {i === 0 && (
                <span style={{ color: 'var(--blue)', fontWeight: 700 }}>HEAD</span>
              )}
              <span>{formatRelativeDate(commit.created_at)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
