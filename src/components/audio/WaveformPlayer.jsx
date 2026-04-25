import WaveSurfer from 'wavesurfer.js'
import { useEffect, useRef, useState } from 'react'

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export function WaveformPlayer({ url, markers = [], onWaveformClick }) {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const durationRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current || !url) return
    setReady(false); setLoading(true); setPlaying(false); setCurrentTime(0); setDuration(0)

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#c8c4ba',
      progressColor: 'var(--blue)',
      cursorColor: 'var(--black)',
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      height: 52,
      normalize: true,
      interact: false,
    })
    wavesurferRef.current = ws
    ws.load(url)

    ws.on('ready', () => {
      const d = ws.getDuration()
      setDuration(d)
      durationRef.current = d
      setReady(true)
      setLoading(false)
    })
    ws.on('audioprocess', (t) => setCurrentTime(t))
    ws.on('seeking', (t) => setCurrentTime(t))
    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('finish', () => { setPlaying(false); setCurrentTime(0) })

    return () => { ws.destroy(); wavesurferRef.current = null }
  }, [url])

  const handleToggle = () => {
    wavesurferRef.current?.playPause()
  }

  const handleOverlayClick = (e) => {
    const ws = wavesurferRef.current
    if (!ws || !ready || durationRef.current === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(durationRef.current, ratio * durationRef.current))
    ws.seekTo(ratio)
    setCurrentTime(time)
    onWaveformClick?.(time)
  }

  return (
    <div style={{ border: '2px solid var(--black)', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px' }}>
        {/* Play/pause */}
        <button
          onClick={handleToggle}
          disabled={!ready}
          title={playing ? 'Pause' : 'Play'}
          style={{
            width: '34px', height: '34px', flexShrink: 0,
            border: '2px solid var(--black)',
            background: playing ? 'var(--black)' : 'transparent',
            color: playing ? 'var(--cream)' : 'var(--black)',
            cursor: ready ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', opacity: ready ? 1 : 0.35,
            transition: 'background 0.1s, color 0.1s',
          }}
        >
          {playing ? '▪' : '▶'}
        </button>

        {/* Waveform */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Click overlay */}
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 20, cursor: ready ? 'crosshair' : 'default' }}
            onClick={handleOverlayClick}
          />
          {/* WaveSurfer mount */}
          <div ref={containerRef} />
          {/* Comment markers */}
          {markers.map((m) => (
            <span
              key={m.id}
              title={`${formatTime(m.time_seconds)}: ${m.content}`}
              style={{
                position: 'absolute', top: 0, zIndex: 10,
                height: '100%', width: '2px',
                background: 'var(--blue)',
                left: `${durationRef.current ? (m.time_seconds / durationRef.current) * 100 : 0}%`,
                cursor: 'default',
              }}
            />
          ))}
          {/* Loading state */}
          {loading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>Loading...</span>
            </div>
          )}
        </div>

        {/* Time */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatTime(currentTime)}<span style={{ color: 'var(--gray)' }}>/{formatTime(duration)}</span>
        </span>
      </div>

      {/* Seek hint */}
      {ready && onWaveformClick && (
        <div style={{ borderTop: '1px solid var(--gray)', padding: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Click waveform to pin a comment at that timestamp
        </div>
      )}
    </div>
  )
}
