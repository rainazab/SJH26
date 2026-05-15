import { useRef, useState } from 'react'

const ACCEPTED_TYPES = new Set([
  'audio/wav', 'audio/mpeg', 'audio/flac',
  'audio/x-aiff', 'audio/aiff', 'audio/mp3',
  'application/octet-stream',
])
const ACCEPTED_EXT = /\.(wav|mp3|flac|aiff|aif|als|alc|adg|adv|agr|asd)$/i

export function Dropzone({ onFiles }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (list) => {
    const files = Array.from(list || [])
    const accepted = files.filter((f) => ACCEPTED_TYPES.has(f.type) || ACCEPTED_EXT.test(f.name))
    onFiles(accepted)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: dragging ? '2px solid var(--blue)' : '2px dashed var(--black)',
        background: dragging ? 'rgba(26,86,255,0.05)' : 'transparent',
        padding: '48px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.1s',
        userSelect: 'none',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', letterSpacing: '2px', marginBottom: '10px', color: dragging ? 'var(--blue)' : 'var(--black)' }}>
        {dragging ? 'DROP IT' : 'DROP STEMS HERE'}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)' }}>
        .wav · .mp3 · .aiff · .flac · .als · .alc · .adg
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', marginTop: '8px' }}>
        or click to browse
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".wav,.mp3,.aiff,.aif,.flac,.als,.alc,.adg,.adv,.agr,.asd,audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
