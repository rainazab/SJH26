export const FILE_TYPE_COLORS = {
  wav:  { color: '#1a56ff', label: 'WAV' },
  mp3:  { color: '#e11d8f', label: 'MP3' },
  flac: { color: '#16a34a', label: 'FLAC' },
  aiff: { color: '#d97706', label: 'AIFF' },
  aif:  { color: '#d97706', label: 'AIFF' },
  als:  { color: '#7c3aed', label: 'Ableton Live Set' },
  alc:  { color: '#9333ea', label: 'Ableton Live Clip' },
  adg:  { color: '#6d28d9', label: 'Ableton Device Group' },
  adv:  { color: '#5b21b6', label: 'Ableton Device Preset' },
  agr:  { color: '#4c1d95', label: 'Ableton Groove' },
  asd:  { color: '#3b0764', label: 'Ableton Sample Data' },
}

export function getFileType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return FILE_TYPE_COLORS[ext] || { color: '#6b7280', label: ext.toUpperCase() || 'FILE' }
}

export function computeLanguageBar(filenames) {
  const counts = {}
  for (const f of filenames) {
    const { label, color } = getFileType(f)
    counts[label] = counts[label] || { count: 0, color }
    counts[label].count++
  }
  const total = filenames.length || 1
  return Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([label, { count, color }]) => ({
      label,
      color,
      pct: ((count / total) * 100).toFixed(1),
    }))
}
