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
  const [copyStatus, setCopyStatus] = useState('')
  const [creatingBranch, setCreatingBranch] = useState(false)
  const [actionError, setActionError] = useState('')

  const activeCommitId = useMemo(
    () => selectedCommitId || commits[0]?.id || null,
    [selectedCommitId, commits]
  )

  const copyInviteLink = async () => {
    if (!project?.invite_token) return
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${project.invite_token}`)
    setCopyStatus('Copied!')
    setTimeout(() => setCopyStatus(''), 2000)
  }

  const createBranch = async () => {
    if (!project || !user || !branchName.trim()) return
    setCreatingBranch(true); setActionError('')
    try {
      const { data: nb, error: e } = await supabase.from('projects').insert({
        name: project.name,
        bpm: project.bpm,
        key: project.key,
        genre: project.genre,
        owner_id: user.id,
        parent_project_id: project.id,
        branch_name: branchName.trim(),
        invite_token: generateToken(),
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
            commit_id: sc.id, project_id: nb.id, uploaded_by: s.uploaded_by,
            filename: s.filename, storage_path: s.storage_path,
            file_size_bytes: s.file_size_bytes, duration_seconds: s.duration_seconds,
          })))
        }
      }
      setBranchOpen(false); setBranchName(''); setCreatingBranch(false)
      navigate(`/project/${nb.id}`)
    } catch (err) {
      setActionError(err.message)
      setCreatingBranch(false)
    }
  }

  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)' }}>
      Loading...
    </div>
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
            <Button variant="secondary" onClick={copyInviteLink}>{copyStatus || '⬡ Invite'}</Button>
            <Button variant="secondary" onClick={() => { setBranchName(''); setBranchOpen(true) }}>⑂ Branch</Button>
            <Link to={`/project/${id}/commit`}><Button variant="blue">+ Commit</Button></Link>
            <Link to={`/project/${id}/log`}><Button variant="secondary">Log</Button></Link>
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
          <CommitTimeline
            commits={commits}
            selectedCommitId={activeCommitId}
            onSelectCommit={setSelectedCommitId}
          />
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
          <Input
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="lo-fi version, trap remix..."
            onKeyDown={(e) => { if (e.key === 'Enter' && branchName.trim() && !creatingBranch) createBranch() }}
            autoFocus
          />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', lineHeight: 1.5 }}>
            The new branch will start with the latest commit's stems. Both projects are independent from that point on.
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <Button variant="blue" onClick={createBranch} disabled={!branchName.trim() || creatingBranch}>
              {creatingBranch ? 'Creating...' : 'Create Branch'}
            </Button>
            <Button variant="secondary" onClick={() => setBranchOpen(false)}>Cancel</Button>
          </div>
          {actionError && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>{actionError}</div>
          )}
        </div>
      </Modal>
    </div>
  )
}
