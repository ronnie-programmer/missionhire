import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      setProfile(data || null)
    } catch (err) {
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  async function saveProfile(data) {
    try {
      const { data: saved, error } = await supabase
        .from('user_profiles')
        .upsert({ ...data, user_id: user.id, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      setProfile(saved)
      toast.success('Profile saved!')
      return saved
    } catch (err) {
      toast.error(err.message || 'Failed to save profile')
      throw err
    }
  }

  // Shape profile into the format expected by edge functions
  function toApiProfile() {
    if (!profile) return null
    return {
      targetRoles: profile.target_roles || [],
      skills: profile.skills || [],
      experienceLevel: profile.experience_level || '',
      remotePreference: profile.remote_preference || 'open',
      resumeText: profile.resume_text || '',
    }
  }

  return { profile, loading, saveProfile, toApiProfile, refetch: fetchProfile }
}
