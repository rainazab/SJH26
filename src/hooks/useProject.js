import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProject(projectId) {
  const [project, setProject] = useState(null)
  const [commits, setCommits] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const [
        { data: projectData, error: projectError },
        { data: commitData, error: commitError },
        { data: branchData, error: branchError },
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('commits').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('projects').select('*').eq('parent_project_id', projectId).order('created_at', { ascending: false }),
      ])

      if (projectError) throw projectError
      if (commitError) throw commitError
      if (branchError) throw branchError

      // Fetch profiles for all commit authors
      const userIds = [...new Set((commitData || []).map(c => c.user_id))]
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds)
        : { data: [] }

      const profileMap = {}
      for (const p of profiles || []) profileMap[p.id] = p

      const commitsWithProfiles = (commitData || []).map(c => ({
        ...c,
        profile: profileMap[c.user_id] || null,
      }))

      setProject(projectData)
      setCommits(commitsWithProfiles)
      setBranches(branchData || [])
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { project, commits, branches, loading, error, refetch }
}