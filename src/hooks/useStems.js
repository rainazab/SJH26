import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useStems() {
  const { user } = useAuth()

  const uploadStem = useCallback(async (file, projectId, commitId) => {
    if (!user) throw new Error('Not logged in')
    const storagePath = `${user.id}/${commitId}/${file.name}`
    const { error: uploadError } = await supabase.storage.from('stems').upload(storagePath, file, { upsert: true })
    if (uploadError) throw uploadError
    const { error: insertError } = await supabase.from('stems').insert({
      commit_id: commitId, project_id: projectId, uploaded_by: user.id,
      filename: file.name, storage_path: storagePath, file_size_bytes: file.size,
    })
    if (insertError) throw insertError
  }, [user])

  const fetchStems = useCallback(async (commitId) => {
    const { data, error } = await supabase.from('stems').select('*').eq('commit_id', commitId).order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  }, [])

  const getSignedUrl = useCallback(async (storagePath) => {
    const { data, error } = await supabase.storage.from('stems').createSignedUrl(storagePath, 3600)
    if (error) throw error
    return data.signedUrl
  }, [])

  return { uploadStem, fetchStems, getSignedUrl }
}