import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useComments() {
  const { user } = useAuth()

  const fetchCommentsForStem = useCallback(async (stemId) => {
    const { data, error } = await supabase.from('comments').select('*').eq('stem_id', stemId).order('time_seconds', { ascending: true })
    if (error) throw error
    return data || []
  }, [])

  const createComment = useCallback(async ({ stemId, content, timeSeconds }) => {
    if (!user) throw new Error('Not logged in')
    const { data, error } = await supabase.from('comments').insert({
      stem_id: stemId, user_id: user.id, content, time_seconds: timeSeconds,
    }).select().single()
    if (error) throw error
    return data
  }, [user])

  return { fetchCommentsForStem, createComment }
}