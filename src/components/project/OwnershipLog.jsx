import { formatRelativeDate } from '../../lib/utils'

const EVENT_ICONS = {
  commit: '◈',
  stem: '▲',
  collab: '◎',
  comment: '◉',
}

function getEventType(id) {
  if (id.startsWith('commit-')) return 'commit'
  if (id.startsWith('stem-')) return 'stem'
  if (id.startsWith('collab-')) return 'collab'
  if (id.startsWith('comment-')) return 'comment'
  return 'commit'
}

function formatFullDate(value) {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function OwnershipLog({ entries }) {
  if (!entries.length) return (
    <div style={{ border: '2px dashed var(--gray)', padding: '60px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '8px' }}>NO EVENTS</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>Activity will appear here once work begins</div>
    </div>
  )

  return (
    <div style={{ border: '2px solid var(--black)', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 200px 60px', borderBottom: '2px solid var(--black)', background: 'var(--black)', padding: '8px 16px', gap: '16px' }}>
        {['', 'Event', 'Timestamp', '#'].map((h) => (
          <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray)' }}>{h}</div>
        ))}
      </div>

      {entries.map((entry, i) => {
        const type = getEventType(entry.id)
        return (
          <div
            key={entry.id}
            style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 200px 60px',
              alignItems: 'start', gap: '16px',
              borderBottom: i < entries.length - 1 ? '1px solid var(--gray)' : 'none',
              padding: '14px 16px',
              background: i % 2 === 0 ? '#fff' : 'rgba(240,236,226,0.4)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--blue)', paddingTop: '1px' }}>
              {EVENT_ICONS[type]}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--black)', lineHeight: 1.5 }}>
              {entry.text}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--black)' }}>
                {formatFullDate(entry.created_at)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                {formatRelativeDate(entry.created_at)}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)', paddingTop: '2px', textAlign: 'right' }}>
              #{String(entries.length - i).padStart(4, '0')}
            </div>
          </div>
        )
      })}
    </div>
  )
}
