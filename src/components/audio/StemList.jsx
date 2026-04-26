import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { useComments } from '../../hooks/useComments'
import { useStems } from '../../hooks/useStems'
import { supabase } from '../../lib/supabase'
import { CommentMarker } from './CommentMarker'

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

const TRACK_COLORS = [
  { wave: '#93c5fd', progress: '#1a56ff' },
  { wave: '#f9a8d4', progress: '#e11d8f' },
  { wave: '#86efac', progress: '#16a34a' },
  { wave: '#fcd34d', progress: '#d97706' },
  { wave: '#c4b5fd', progress: '#7c3aed' },
  { wave: '#fdba74', progress: '#ea580c' },
]

function getColor(i) { return TRACK_COLORS[i % TRACK_COLORS.length] }

function shortName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .split(/[\s\-_]+/)
    .filter(w => w.length > 2)
    .slice(-3).join(' ')
    .toUpperCase().slice(0, 18)
}

// ─── The key component: renders containers first, THEN inits WaveSurfer ───────
function MultiTrackPlayer({ stems, urls, profiles }) {
  const containerRefs = useRef({})
  const wsRefs = useRef({})
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [readyIds, setReadyIds] = useState(new Set())

  // THIS is the fix: useEffect runs after the browser has painted the DOM.
  // By the time this runs, all the container divs from the render below
  // are guaranteed to exist in the real document tree.
  useEffect(() => {
    if (!stems.length || !Object.keys(urls).length) return

    // Destroy any previous instances
    Object.values(wsRefs.current).forEach(ws => { try { ws.destroy() } catch {} })
    wsRefs.current = {}
    setReadyIds(new Set())
    setCurrentTime(0)
    setDuration(0)
    setPlaying(false)

    stems.forEach((stem, i) => {
      const url = urls[stem.id]
      const container = containerRefs.current[stem.id]

      // Both must exist — url might not be ready yet
      if (!url || !container) return

      const color = getColor(i)

      let ws
      try {
        ws = WaveSurfer.create({
          container,
          waveColor: color.wave,
          progressColor: color.progress,
          cursorColor: '#333',
          barWidth: 2,
          barGap: 1,
          height: 48,
          normalize: true,
          interact: false,
        })
      } catch (err) {
        console.error('[MultiTrack] WaveSurfer.create failed for', stem.filename, err)
        return
      }

      wsRefs.current[stem.id] = ws
      ws.load(url)

      ws.on('ready', () => {
        setReadyIds(prev => new Set([...prev, stem.id]))
        setDuration(prev => Math.max(prev, ws.getDuration()))
      })

      ws.on('audioprocess', t => setCurrentTime(t))
      ws.on('finish', () => {
        setPlaying(false)
        setCurrentTime(0)
      })

      ws.on('error', err => console.error('[WaveSurfer]', stem.filename, err))
    })

    return () => {
      Object.values(wsRefs.current).forEach(ws => { try { ws.destroy() } catch {} })
      wsRefs.current = {}
    }
  // Re-run when stems or urls change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stems.map(s => s.id).join(','), stems.map(s => urls[s.id] || '').join(',')])

  const allReady = readyIds.size >= stems.length && stems.length > 0

  const togglePlay = () => {
    const wsList = Object.values(wsRefs.current)
    if (!wsList.length) return
    if (playing) {
      wsList.forEach(ws => { try { ws.pause() } catch {} })
    } else {
      // Fire all play() calls in same tick for sync
      wsList.forEach(ws => { try { ws.play() } catch {} })
    }
    setPlaying(p => !p)
  }

  const seek = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    Object.values(wsRefs.current).forEach(ws => { try { ws.seekTo(ratio) } catch {} })
    setCurrentTime(ratio * duration)
  }

  return (
    <div style={{ border: '2px solid var(--black)', background: '#0a0a0a', overflow: 'hidden' }}>

      {/* Transport */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #222' }}>
        <button
          onClick={togglePlay}
          disabled={!allReady}
          style={{
            width: '44px', height: '44px',
            border: `2px solid ${allReady ? '#1a56ff' : '#333'}`,
            background: playing ? '#1a56ff' : 'transparent',
            color: playing ? '#fff' : (allReady ? '#1a56ff' : '#333'),
            cursor: allReady ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0, transition: 'all 0.1s',
          }}
        >
          {playing ? '▪' : '▶'}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '2px', color: '#f0ece2' }}>
              {allReady ? `${stems.length} TRACKS · PLAY IN SYNC` : `LOADING ${readyIds.size} / ${stems.length}...`}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#555' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div
            onClick={seek}
            style={{ height: '5px', background: '#222', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #1a56ff, #e11d8f)',
              width: duration ? `${(currentTime / duration) * 100}%` : '0%',
              transition: 'width 0.08s linear',
            }} />
          </div>
        </div>
      </div>

      {/* Track rows — these render FIRST, then useEffect above inits WaveSurfer into them */}
      {stems.map((stem, i) => {
        const color = getColor(i)
        const profile = profiles[stem.uploaded_by]
        const author = profile?.display_name || profile?.username || 'unknown'
        return (
          <div
            key={stem.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr',
              borderBottom: i < stems.length - 1 ? '1px solid #1a1a1a' : 'none',
            }}
          >
            {/* Label */}
            <div style={{
              borderRight: `3px solid ${color.progress}`,
              padding: '10px 12px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              background: '#111',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: color.progress, marginBottom: '3px', lineHeight: 1.2 }}>
                {shortName(stem.filename)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                @{author}
              </div>
            </div>

            {/* Container div — this is what WaveSurfer mounts into */}
            <div style={{ background: '#0d0d0d', display: 'flex', alignItems: 'center', padding: '8px 4px' }}>
              <div
                ref={el => { if (el) containerRefs.current[stem.id] = el }}
                style={{ width: '100%', minHeight: '48px' }}
              />
            </div>
          </div>
        )
      })}

      {/* Contributor legend */}
      <div style={{ borderTop: '1px solid #222', padding: '10px 20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {stems.map((stem, i) => {
          const color = getColor(i)
          const profile = profiles[stem.uploaded_by]
          const author = profile?.display_name || profile?.username || 'unknown'
          return (
            <div key={stem.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', background: color.progress, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                @{author}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Single stem waveform ─────────────────────────────────────────────────────
function StemRow({ stem, url, comments, onWaveformClick, colorIndex }) {
  const containerRef = useRef(null)
  const wsRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [ready, setReady] = useState(false)
  const color = getColor(colorIndex)

  useEffect(() => {
    if (!containerRef.current || !url) return
    let ws
    try {
      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: color.wave,
        progressColor: color.progress,
        cursorColor: '#0a0a0a',
        barWidth: 2, barGap: 1, height: 44, normalize: true,
      })
    } catch (err) {
      console.error('[StemRow] WaveSurfer.create failed', err)
      return
    }
    wsRef.current = ws
    ws.load(url)
    ws.on('ready', () => { setDuration(ws.getDuration()); setReady(true) })
    ws.on('audioprocess', t => setCurrentTime(t))
    ws.on('finish', () => setPlaying(false))
    return () => { try { ws.destroy() } catch {} }
  }, [url])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <button
          onClick={() => { wsRef.current?.playPause(); setPlaying(p => !p) }}
          disabled={!ready}
          style={{ width: '30px', height: '30px', border: `2px solid ${color.progress}`, background: playing ? color.progress : 'transparent', color: playing ? '#fff' : color.progress, cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}
        >
          {playing ? '▪' : '▶'}
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--black)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {stem.filename}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', flexShrink: 0 }}>
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 20, cursor: 'crosshair' }}
          onClick={(e) => {
            if (!duration || !onWaveformClick) return
            const rect = e.currentTarget.getBoundingClientRect()
            onWaveformClick(Math.max(0, Math.min(duration, ((e.clientX - rect.left) / rect.width) * duration)))
          }}
        />
        <div ref={containerRef} />
        {comments.map(m => (
          <span key={m.id} title={m.content} style={{ position: 'absolute', top: 0, zIndex: 10, height: '100%', width: '2px', background: color.progress, left: `${duration ? (m.time_seconds / duration) * 100 : 0}%` }} />
        ))}
      </div>
      {comments.map(c => <CommentMarker key={c.id} timeSeconds={c.time_seconds} content={c.content} />)}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function StemList({ commitId }) {
  const { fetchStems, getSignedUrl } = useStems()
  const { fetchCommentsForStem, createComment } = useComments()
  const [stems, setStems] = useState([])
  const [urls, setUrls] = useState({})
  const [profiles, setProfiles] = useState({})
  const [commentsByStem, setCommentsByStem] = useState({})
  const [pendingComment, setPendingComment] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('multi')

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
      setStems([]); setUrls({}); setProfiles({})
      try {
        const stemRows = await fetchStemsRef.current(commitId)
        if (cancelled) return
        setStems(stemRows)

        const uploaderIds = [...new Set(stemRows.map(s => s.uploaded_by).filter(Boolean))]
        if (uploaderIds.length) {
          const { data: profileData } = await supabase
            .from('profiles').select('id, username, display_name').in('id', uploaderIds)
          const map = {}
          for (const p of profileData || []) map[p.id] = p
          if (!cancelled) setProfiles(map)
        }

        const signed = {}
        const nextComments = {}
        for (const stem of stemRows) {
          signed[stem.id] = await getSignedUrlRef.current(stem.storage_path)
          nextComments[stem.id] = await fetchCommentsRef.current(stem.id)
          if (cancelled) return
        }
        setUrls(signed)
        setCommentsByStem(nextComments)
        setViewMode(stemRows.length > 1 ? 'multi' : 'individual')
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load stems')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [commitId])

  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)', padding: '24px 0' }}>
      Loading stems...
    </div>
  )
  if (error) return <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{error}</div>
  if (!stems.length) return (
    <div style={{ border: '2px dashed var(--gray)', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--gray-mid)' }}>NO STEMS YET</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Create a commit to upload audio files</div>
    </div>
  )

  // Don't render MultiTrackPlayer until urls are loaded
  // This is critical — stems render their container divs, THEN useEffect in
  // MultiTrackPlayer fires and the DOM elements are guaranteed present
  const urlsLoaded = stems.length > 0 && stems.every(s => !!urls[s.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {stems.length > 1 && (
        <div style={{ display: 'flex', border: '2px solid var(--black)', alignSelf: 'flex-start' }}>
          {[['multi', '⊕ Mix View'], ['individual', '≡ Tracks']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{ padding: '6px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', border: 'none', borderRight: mode === 'multi' ? '2px solid var(--black)' : 'none', background: viewMode === mode ? 'var(--black)' : 'transparent', color: viewMode === mode ? 'var(--cream)' : 'var(--gray-mid)', cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Only mount MultiTrackPlayer once all signed URLs are ready */}
      {viewMode === 'multi' && stems.length > 1 && urlsLoaded && (
        <MultiTrackPlayer stems={stems} urls={urls} profiles={profiles} />
      )}

      {!urlsLoaded && viewMode === 'multi' && stems.length > 1 && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)', padding: '16px 0' }}>
          Preparing tracks...
        </div>
      )}

      {(viewMode === 'individual' || stems.length === 1) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stems.map((stem, i) => {
            const color = getColor(i)
            const profile = profiles[stem.uploaded_by]
            const author = profile?.display_name || profile?.username
            return (
              <div key={stem.id} style={{ border: '2px solid var(--black)', background: '#fff' }}>
                <div style={{ borderBottom: `3px solid ${color.progress}`, padding: '8px 14px', background: 'var(--black)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: color.progress, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ◈ {shortName(stem.filename)}
                  </span>
                  {author && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: color.progress, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      @{author}
                    </span>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <StemRow stem={stem} url={urls[stem.id]} comments={commentsByStem[stem.id] || []} colorIndex={i}
                    onWaveformClick={(time) => setPendingComment(cur => ({ ...cur, [stem.id]: { ...(cur[stem.id] || {}), timeSeconds: time } }))}
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                    <input
                      style={{ flex: 1, background: 'var(--cream)', border: '2px solid var(--black)', padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px', outline: 'none' }}
                      placeholder={pendingComment[stem.id]?.timeSeconds !== undefined ? `Note at ${Math.round(pendingComment[stem.id].timeSeconds)}s...` : 'Click waveform to select timestamp...'}
                      value={pendingComment[stem.id]?.content || ''}
                      onChange={(e) => setPendingComment(cur => ({ ...cur, [stem.id]: { ...(cur[stem.id] || {}), content: e.target.value } }))}
                    />
                    <button
                      disabled={!pendingComment[stem.id]?.content || pendingComment[stem.id]?.timeSeconds === undefined}
                      onClick={async () => {
                        const draft = pendingComment[stem.id]
                        if (!draft?.content || draft?.timeSeconds === undefined) return
                        try {
                          const created = await createComment({ stemId: stem.id, content: draft.content, timeSeconds: draft.timeSeconds })
                          setCommentsByStem(cur => ({ ...cur, [stem.id]: [...(cur[stem.id] || []), created].sort((a, b) => a.time_seconds - b.time_seconds) }))
                          setPendingComment(cur => ({ ...cur, [stem.id]: { content: '', timeSeconds: draft.timeSeconds } }))
                        } catch (e) { setError(e.message) }
                      }}
                      style={{ background: color.progress, color: '#fff', border: `2px solid ${color.progress}`, padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', opacity: (!pendingComment[stem.id]?.content || pendingComment[stem.id]?.timeSeconds === undefined) ? 0.4 : 1 }}
                    >
                      Pin
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}