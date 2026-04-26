import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StemList } from '../components/audio/StemList'
import { BranchTree } from '../components/project/BranchTree'
import { CommitTimeline } from '../components/project/CommitTimeline'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useProject } from '../hooks/useProject'
import { supabase } from '../lib/supabase'
import { generateToken } from '../lib/utils'

export function Project() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { project, commits, branches, loading, error, refetch } = useProject(id)
  const [selectedCommitId, setSelectedCommitId] = useState(null)
  const [branchOpen, setBranchOpen] = useState(false)
  const [branchName, setBranchName] = useState('')
  const [shareStatus, setShareStatus] = useState('')
  const [creatingBranch, setCreatingBranch] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [selectedMergeIds, setSelectedMergeIds] = useState([])
  const [mergeMessage, setMergeMessage] = useState('')
  const [merging, setMerging] = useState(false)
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

  const shareLink = async () => {
    if (!project?.invite_token) return
    const url = `${window.location.origin}/invite/${project.invite_token}`
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('Link copied!')
    } catch {
      setShareStatus(url) // fallback: show the URL
    }
    setTimeout(() => setShareStatus(''), 3000)
  }

  const createBranch = async () => {
    if (!project || !user || !branchName.trim()) return
    setCreatingBranch(true); setActionError('')
    try {
      const { data: nb, error: e } = await supabase.from('projects').insert({
        name: project.name, bpm: project.bpm, key: project.key, genre: project.genre,
        owner_id: user.id, parent_project_id: project.id,
        branch_name: branchName.trim(), invite_token: generateToken(),
      }).select().single()
      if (e) throw e

      if (commits[0]) {
        const { data: sc, error: ce } = await supabase.from('commits').insert({
          project_id: nb.id, user_id: user.id,
          message: `Branched from main — ${branchName.trim()}`,
        }).select().single()
        if (ce) throw ce
        const { data: oldStems } = await supabase.from('stems').select('*').eq('commit_id', commits[0].id)
        if (oldStems?.length) {
          await supabase.from('stems').insert(oldStems.map(s => ({
            commit_id: sc.id, project_id: nb.id, uploaded_by: user.id,
            filename: s.filename, storage_path: s.storage_path,
            file_size_bytes: s.file_size_bytes,
          })))
        }
      }
      setBranchOpen(false); setBranchName(''); setCreatingBranch(false)
      navigate(`/project/${nb.id}`)
    } catch (err) { setActionError(err.message); setCreatingBranch(false) }
  }

  // FIX: set uploaded_by to current user (auth.uid()) not original uploader
  const mergeCommits = async () => {
    if (!user || selectedMergeIds.length < 2 || !mergeMessage.trim()) return
    setMerging(true); setActionError('')
    try {
      const { data: newCommit, error: ce } = await supabase
        .from('commits')
        .insert({ project_id: id, user_id: user.id, message: mergeMessage.trim() })
        .select().single()
      if (ce) throw ce

      const { data: stems, error: se } = await supabase
        .from('stems').select('*').in('commit_id', selectedMergeIds)
      if (se) throw se

      if (stems?.length) {
        const { error: ie } = await supabase.from('stems').insert(
          stems.map(s => ({
            commit_id: newCommit.id,
            project_id: id,
            uploaded_by: user.id, // ← THIS was the RLS bug. Must be current user.
            filename: s.filename,
            storage_path: s.storage_path,
            file_size_bytes: s.file_size_bytes,
          }))
        )
        if (ie) throw ie
      }

      setMergeOpen(false); setSelectedMergeIds([]); setMergeMessage(''); setMerging(false)
      refetch()
    } catch (err) { setActionError(err.message); setMerging(false) }
  }

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

  const toggleMergeId = (commitId) => {
    setSelectedMergeIds(prev =>
      prev.includes(commitId) ? prev.filter(x => x !== commitId) : [...prev, commitId]
    )
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
            {/* Share / Sync */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <Button variant="blue" onClick={shareLink}>
                {shareStatus ? '✓ ' + shareStatus : '⬡ Share to Collab'}
              </Button>
              {!shareStatus && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  anyone with the link can contribute
                </div>
              )}
            </div>
            <Button variant="secondary" onClick={() => { setBranchName(''); setBranchOpen(true) }}>⑂ Branch</Button>
            {commits.length >= 2 && (
              <Button variant="secondary" onClick={() => { setSelectedMergeIds([]); setMergeMessage(''); setMergeOpen(true) }}>⊕ Merge</Button>
            )}
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
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '0', alignItems: 'start' }}>
        <div style={{ borderRight: '2px solid var(--black)', paddingRight: '24px', marginRight: '24px' }}>
          <CommitTimeline commits={commits} selectedCommitId={activeCommitId} onSelectCommit={setSelectedCommitId} />
          <BranchTree projectId={id} branches={branches} />
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

      {/* Branch modal */}
      <Modal open={branchOpen} onClose={() => setBranchOpen(false)} title="CREATE BRANCH">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Fork this project into a new direction
          </div>
          <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="lo-fi version, trap remix..." autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && branchName.trim() && !creatingBranch) createBranch() }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="blue" onClick={createBranch} disabled={!branchName.trim() || creatingBranch}>
              {creatingBranch ? 'Creating...' : 'Create Branch'}
            </Button>
            <Button variant="secondary" onClick={() => setBranchOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Merge modal */}
      <Modal open={mergeOpen} onClose={() => setMergeOpen(false)} title="MERGE COMMITS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Select commits to merge — their stems will be combined
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid var(--black)', maxHeight: '200px', overflowY: 'auto' }}>
            {commits.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderBottom: '1px solid var(--gray)', background: selectedMergeIds.includes(c.id) ? 'rgba(26,86,255,0.06)' : 'transparent' }}>
                <input type="checkbox" checked={selectedMergeIds.includes(c.id)} onChange={() => toggleMergeId(c.id)}
                  style={{ marginTop: '2px', accentColor: 'var(--blue)', cursor: 'pointer', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{c.message}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray-mid)', marginTop: '2px' }}>
                    @{c.profile?.display_name || c.profile?.username || 'unknown'} · {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <Input value={mergeMessage} onChange={(e) => setMergeMessage(e.target.value)}
            placeholder="Final mix — drums + bass + melody"
            onKeyDown={(e) => { if (e.key === 'Enter' && selectedMergeIds.length >= 2 && mergeMessage.trim() && !merging) mergeCommits() }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: selectedMergeIds.length >= 2 ? 'var(--blue)' : 'var(--gray-mid)' }}>
            {selectedMergeIds.length < 2 ? `Select at least 2 commits (${selectedMergeIds.length} selected)` : `${selectedMergeIds.length} commits selected — stems will be pooled`}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="blue" onClick={mergeCommits} disabled={selectedMergeIds.length < 2 || !mergeMessage.trim() || merging}>
              {merging ? 'Merging...' : 'Merge'}
            </Button>
            <Button variant="secondary" onClick={() => setMergeOpen(false)}>Cancel</Button>
          </div>
          {actionError && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>{actionError}</div>}
        </div>
      </Modal>

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