import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StemList } from '../components/audio/StemList'
import { CommitTimeline } from '../components/project/CommitTimeline'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useProject } from '../hooks/useProject'
import { supabase } from '../lib/supabase'

export function Project() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { project, commits, loading, error, refetch } = useProject(id)
  const [selectedCommitId, setSelectedCommitId] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBpm, setEditBpm] = useState('')
  const [editKey, setEditKey] = useState('')
  const [editGenre, setEditGenre] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [actionError, setActionError] = useState('')

  const activeCommitId = useMemo(
    () => selectedCommitId || commits[0]?.id || null,
    [selectedCommitId, commits]
  )

  const isOwner = user && project && user.id === project.owner_id

  const openEdit = () => {
    setEditName(project?.name || '')
    setEditBpm(project?.bpm?.toString() || '')
    setEditKey(project?.key || '')
    setEditGenre(project?.genre || '')
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!project) return
    setSaving(true); setActionError('')
    try {
      const { error: e } = await supabase.from('projects').update({
        name: editName.trim(),
        bpm: editBpm ? Number(editBpm) : null,
        key: editKey.trim() || null,
        genre: editGenre.trim() || null,
      }).eq('id', project.id)
      if (e) throw e
      setEditOpen(false)
      refetch()
    } catch (err) { setActionError(err.message) }
    finally { setSaving(false) }
  }

  const deleteProject = async () => {
    if (!project) return
    try {
      const { error: e } = await supabase.from('projects').delete().eq('id', project.id)
      if (e) throw e
      navigate('/dashboard')
    } catch (err) { setActionError(err.message) }
  }

  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)' }}>Loading...</div>
  )
  if (error) return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', marginBottom: '12px' }}>{error}</div>
      <Button variant="secondary" onClick={refetch}>Retry</Button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '2px solid var(--black)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--gray-mid)', marginBottom: '8px', display: 'flex', gap: '12px' }}>
          <Link to="/dashboard" style={{ color: 'var(--gray-mid)', textDecoration: 'none' }}>Dashboard</Link>
          <span>›</span>
          <span>{project?.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', letterSpacing: '2px', lineHeight: 1 }}>{project?.name}</h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {project?.bpm && <Badge>{project.bpm} BPM</Badge>}
                {project?.key && <Badge>{project.key}</Badge>}
                {project?.genre && <Badge>{project.genre}</Badge>}
                {project?.branch_name && project.branch_name !== 'main' && <Badge blue>{project.branch_name}</Badge>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Link to={`/project/${id}/commit`}><Button variant="blue">+ Commit</Button></Link>
            <Link to={`/project/${id}/log`}><Button variant="secondary">Log</Button></Link>
            {isOwner && (
              <>
                <Button variant="secondary" onClick={openEdit}>Edit</Button>
                <Button variant="danger" onClick={() => setDeleteConfirm(true)}>Delete</Button>
              </>
            )}
          </div>
        </div>
        {actionError && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', marginTop: '8px', borderLeft: '2px solid var(--red)', paddingLeft: '10px' }}>
            {actionError}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '0', alignItems: 'start' }}>
        <div style={{ borderRight: '2px solid var(--black)', paddingRight: '32px', marginRight: '32px' }}>
          <CommitTimeline
            commits={commits}
            selectedCommitId={activeCommitId}
            onSelectCommit={setSelectedCommitId}
            projectOwnerId={project?.owner_id}
            onCommitDeleted={refetch}
          />
        </div>
        <div>
          {activeCommitId ? (
            <StemList commitId={activeCommitId} />
          ) : (
            <div style={{ border: '2px dashed var(--gray)', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '12px' }}>NO COMMITS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray-mid)', marginBottom: '20px' }}>Upload your first stems to start the record</div>
              <Link to={`/project/${id}/commit`}><Button variant="blue">Create First Commit</Button></Link>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="EDIT PROJECT">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input placeholder="Project name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <Input placeholder="BPM" value={editBpm} onChange={(e) => setEditBpm(e.target.value)} type="number" />
            <Input placeholder="Key" value={editKey} onChange={(e) => setEditKey(e.target.value)} />
            <Input placeholder="Genre" value={editGenre} onChange={(e) => setEditGenre(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="blue" onClick={saveEdit} disabled={!editName.trim() || saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          </div>
          {actionError && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>{actionError}</div>}
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="DELETE PROJECT">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6 }}>
            This will permanently delete <strong>{project?.name}</strong> and all its commits, stems, and comments. This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="danger" onClick={deleteProject}>Delete Forever</Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}