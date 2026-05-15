import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProject(projectId) {
  const [project, setProject] = useState(null)
  const [commits, setCommits] = useState([])
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
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('commits').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      ])

      if (projectError) throw projectError
      if (commitError) throw commitError

      const userIds = [...new Set((commitData || []).map(c => c.user_id))]
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, username').in('id', userIds)
        : { data: [] }

      const profileMap = {}
      for (const p of profiles || []) profileMap[p.id] = p

      const commitsWithProfiles = (commitData || []).map(c => ({
        ...c,
        profile: profileMap[c.user_id] || null,
      }))

      setProject(projectData)
      setCommits(commitsWithProfiles)
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { project, commits, loading, error, refetch }
}