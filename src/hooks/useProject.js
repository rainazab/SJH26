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
      const [{ data: projectData, error: projectError }, { data: commitData, error: commitError }, { data: branchData, error: branchError }] =
        await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).single(),
          supabase.from('commits').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
          supabase.from('projects').select('*').eq('parent_project_id', projectId).order('created_at', { ascending: false }),
        ])

      if (projectError) throw projectError
      if (commitError) throw commitError
      if (branchError) throw branchError

      setProject(projectData)
      setCommits(commitData || [])
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
