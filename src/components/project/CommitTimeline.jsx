import { useState } from 'react'
import { formatRelativeDate } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function CommitTimeline({ commits, selectedCommitId, onSelectCommit, projectOwnerId, onCommitDeleted }) {
  const { user } = useAuth()
  const isOwner = user && user.id === projectOwnerId
  const [deleting, setDeleting] = useState(false)

  const deleteCommit = async (commitId, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this commit? This cannot be undone.')) return
    setDeleting(true)
    try {
      await supabase.from('commits').delete().eq('id', commitId)
      onCommitDeleted?.()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

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
        const author = commit.profile?.display_name || commit.profile?.username || 'unknown'
        const isHead = i === 0
        return (
          <div
            key={commit.id}
            style={{ position: 'relative' }}
            onMouseEnter={e => e.currentTarget.querySelector('.delete-btn')?.style && (e.currentTarget.querySelector('.delete-btn').style.opacity = '1')}
            onMouseLeave={e => e.currentTarget.querySelector('.delete-btn')?.style && (e.currentTarget.querySelector('.delete-btn').style.opacity = '0')}
          >
            <button
              onClick={() => onSelectCommit(commit.id)}
              style={{
                background: selected ? 'var(--black)' : 'transparent',
                color: selected ? 'var(--cream)' : 'var(--black)',
                border: 'none',
                borderLeft: selected ? '3px solid var(--blue)' : '3px solid transparent',
                borderBottom: '1px solid var(--gray)',
                padding: '10px 12px',
                paddingRight: isOwner && isHead ? '36px' : '12px',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'rgba(26,86,255,0.06)' }}
              onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '4px', wordBreak: 'break-word', lineHeight: 1.4 }}>
                {commit.message || '(no message)'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {isHead && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--blue)', background: 'rgba(26,86,255,0.12)', padding: '1px 5px' }}>HEAD</span>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: selected ? 'var(--gray)' : 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  @{author}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: selected ? 'var(--gray)' : 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {formatRelativeDate(commit.created_at)}
                </span>
              </div>
            </button>

            {isOwner && isHead && (
              <button
                className="delete-btn"
                onClick={(e) => deleteCommit(commit.id, e)}
                disabled={deleting}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: '16px', color: '#e02020',
                  opacity: 0, transition: 'opacity 0.1s', padding: '4px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}