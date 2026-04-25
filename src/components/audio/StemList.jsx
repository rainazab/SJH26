import { useEffect, useRef, useState } from 'react'
import { useComments } from '../../hooks/useComments'
import { useStems } from '../../hooks/useStems'
import { CommentMarker } from './CommentMarker'
import { WaveformPlayer } from './WaveformPlayer'
import { formatFileSize } from '../../lib/utils'

export function StemList({ commitId }) {
  const { fetchStems, getSignedUrl } = useStems()
  const { fetchCommentsForStem, createComment } = useComments()
  const [stems, setStems] = useState([])
  const [urls, setUrls] = useState({})
  const [commentsByStem, setCommentsByStem] = useState({})
  const [pendingComment, setPendingComment] = useState({})
  const [pinning, setPinning] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStemsRef = useRef(fetchStems)
  const getSignedUrlRef = useRef(getSignedUrl)
  const fetchCommentsRef = useRef(fetchCommentsForStem)
  fetchStemsRef.current = fetchStems
  getSignedUrlRef.current = getSignedUrl
  fetchCommentsRef.current = fetchCommentsForStem

  useEffect(() => {
    if (!commitId) return
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      try {
        const stemRows = await fetchStemsRef.current(commitId)
        if (cancelled) return
        setStems(stemRows)
        const signed = {}
        const nextComments = {}
        for (const stem of stemRows) {
          signed[stem.id] = await getSignedUrlRef.current(stem.storage_path)
          nextComments[stem.id] = await fetchCommentsRef.current(stem.id)
          if (cancelled) return
        }
        setUrls(signed)
        setCommentsByStem(nextComments)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load stems')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [commitId])

  const handlePin = async (stemId) => {
    const draft = pendingComment[stemId]
    if (!draft?.content?.trim() || draft?.timeSeconds === undefined) return
    setPinning((cur) => ({ ...cur, [stemId]: true }))
    try {
      const created = await createComment({ stemId, content: draft.content.trim(), timeSeconds: draft.timeSeconds })
      setCommentsByStem((cur) => ({
        ...cur,
        [stemId]: [...(cur[stemId] || []), created].sort((a, b) => a.time_seconds - b.time_seconds),
      }))
      setPendingComment((cur) => ({ ...cur, [stemId]: { ...cur[stemId], content: '' } }))
    } catch (e) {
      setError(e.message)
    } finally {
      setPinning((cur) => ({ ...cur, [stemId]: false }))
    }
  }

  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)', padding: '24px 0' }}>
      Loading stems...
    </div>
  )
  if (error) return <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{error}</div>
  if (!stems.length) return (
    <div style={{ border: '2px dashed var(--gray)', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--gray-mid)' }}>NO STEMS</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>This commit has no audio files attached</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {stems.map((stem) => {
        const pending = pendingComment[stem.id] || {}
        const hasTimestamp = pending.timeSeconds !== undefined
        const hasContent = (pending.content || '').trim().length > 0
        const comments = commentsByStem[stem.id] || []

        return (
          <div key={stem.id} style={{ border: '2px solid var(--black)', background: '#fff' }}>
            {/* Stem header */}
            <div style={{
              borderBottom: '2px solid var(--black)', padding: '8px 14px',
              background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cream)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ◈ {stem.filename}
              </span>
              {stem.file_size_bytes > 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)' }}>
                  {formatFileSize(stem.file_size_bytes)}
                </span>
              )}
            </div>

            <div style={{ padding: '14px' }}>
              {/* Waveform */}
              <WaveformPlayer
                url={urls[stem.id]}
                markers={comments}
                onWaveformClick={(time) =>
                  setPendingComment((cur) => ({ ...cur, [stem.id]: { ...(cur[stem.id] || {}), timeSeconds: time } }))
                }
              />

              {/* Comment composer */}
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--gray)', paddingTop: '12px' }}>
                {/* Timestamp badge */}
                {hasTimestamp && (
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', background: 'var(--blue)', color: '#fff', padding: '2px 8px' }}>
                      @ {Math.floor(pending.timeSeconds / 60)}:{Math.floor(pending.timeSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)' }}>timestamp selected</span>
                    <button
                      onClick={() => setPendingComment((cur) => ({ ...cur, [stem.id]: { ...cur[stem.id], timeSeconds: undefined } }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', textDecoration: 'underline', padding: 0 }}
                    >
                      clear
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{
                      flex: 1, background: 'var(--cream)', border: `2px solid ${hasTimestamp ? 'var(--black)' : 'var(--gray)'}`,
                      padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px', outline: 'none', color: 'var(--black)',
                      transition: 'border-color 0.1s',
                    }}
                    placeholder={hasTimestamp ? 'Add a note for this moment...' : 'Click the waveform to select a timestamp first'}
                    value={pending.content || ''}
                    onChange={(e) => setPendingComment((cur) => ({ ...cur, [stem.id]: { ...(cur[stem.id] || {}), content: e.target.value } }))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && hasTimestamp && hasContent) handlePin(stem.id) }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--blue)' }}
                    onBlur={(e) => { e.target.style.borderColor = hasTimestamp ? 'var(--black)' : 'var(--gray)' }}
                    disabled={!hasTimestamp}
                  />
                  <button
                    disabled={!hasContent || !hasTimestamp || pinning[stem.id]}
                    onClick={() => handlePin(stem.id)}
                    style={{
                      background: 'var(--blue)', color: '#fff',
                      border: '2px solid var(--blue)', padding: '7px 16px',
                      fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase',
                      letterSpacing: '1px', cursor: 'pointer',
                      opacity: (!hasContent || !hasTimestamp) ? 0.35 : 1,
                      transition: 'opacity 0.1s',
                    }}
                  >
                    {pinning[stem.id] ? '...' : 'Pin'}
                  </button>
                </div>

                {/* Comments list */}
                {comments.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {comments.map((c) => (
                      <CommentMarker key={c.id} timeSeconds={c.time_seconds} content={c.content} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
