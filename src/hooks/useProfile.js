// src/hooks/useProfile.js
//
// Custom hook that manages reading and writing the user's profile from the
// `user_profiles` table, and transforms the stored data into the format
// expected by the AI Edge Functions.
//
// UPSERT PATTERN:
//   saveProfile() uses Supabase's .upsert() which performs an INSERT if no row
//   exists for user_id, or an UPDATE if one does. This means the profile page
//   works identically for new users (who have no profile yet) and returning
//   users — no need for separate create/update logic.
//
// ERROR CODE 'PGRST116':
//   When .single() finds zero rows it throws this specific PostgREST error code
//   instead of returning null data. We explicitly ignore it because "no profile
//   yet" is a normal state for a new user, not an error worth logging.
//
// toApiProfile():
//   The `user_profiles` table stores data in snake_case (target_roles, skills, etc.)
//   because that is PostgreSQL convention. The Edge Functions expect camelCase
//   (targetRoles, skills, etc.) because that is JavaScript/JSON convention.
//   This method converts between the two, acting as a data transform layer so
//   neither the DB schema nor the API contract has to change to accommodate the other.
//
// Returns: { profile, loading, saveProfile, toApiProfile, refetch }

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
      // PGRST116 = "no rows found" — this is expected for new users who haven't
      // filled out their profile yet, so we treat it as a non-error.
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

  // toApiProfile converts snake_case DB fields to the camelCase format the Edge
  // Functions expect. Centralizing this transform means if the API contract ever
  // changes, we only update it here — not in every component that calls an AI function.
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
