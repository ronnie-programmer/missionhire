// src/hooks/useJobs.js
//
// Custom hook that owns all CRUD operations for the `job_applications` table.
// Any component that needs job data imports this hook rather than writing its
// own Supabase calls — keeping data-fetching logic in one place.
//
// DATA ISOLATION VIA RLS:
//   The Supabase query below does NOT filter by user_id in the WHERE clause.
//   Instead, Row Level Security (RLS) policies on the `job_applications` table
//   automatically enforce that each user sees only their own rows. This is
//   intentional: security lives in the database, not in client-side code that
//   could be bypassed.
//
// useCallback on fetchJobs:
//   fetchJobs is listed as a dependency of the useEffect below. Without
//   useCallback, it would be recreated on every render, causing the effect to
//   re-run in an infinite loop. useCallback memoizes the function and only
//   recreates it when `user` changes (e.g., after login/logout).
//
// OPTIMISTIC UPDATE in updateJobStatus:
//   When a card is dragged to a new column, the UI updates instantly (optimistic)
//   before the database round-trip completes. If the Supabase update fails, we
//   call fetchJobs() to roll back to the server's truth. This makes drag-and-drop
//   feel instant rather than waiting ~200ms for a network response.
//
// Returns: { jobs, loading, error, createJob, updateJob, deleteJob, updateJobStatus, refetch }

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // useCallback ensures this function reference is stable across renders.
  // It only changes when `user` changes — critical to avoid the infinite loop
  // described in the file header.
  const fetchJobs = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      // RLS filters results to the authenticated user — no .eq('user_id') needed.
      // .order('created_at', { ascending: false }) puts the newest applications first.
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setJobs(data || [])
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // createJob explicitly sets user_id because RLS INSERT policies require it.
  // .select().single() returns the newly created row (with server-generated id,
  // created_at, etc.) so we can add it to local state without another fetch.
  async function createJob(jobData) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{ ...jobData, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      // Prepend the new job so it appears at the top of the list immediately.
      setJobs(prev => [data, ...prev])
      toast.success('Application added!')
      return data
    } catch (err) {
      toast.error(err.message || 'Failed to add application')
      throw err
    }
  }

  // updateJob patches only the changed fields (Supabase PATCH semantics).
  // .eq('id', id) targets a specific row; RLS also verifies the row belongs
  // to the authenticated user so other users cannot patch each other's rows.
  async function updateJob(id, updates) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      // Replace the old version in local state with the server-confirmed version.
      setJobs(prev => prev.map(j => j.id === id ? data : j))
      return data
    } catch (err) {
      toast.error(err.message || 'Failed to update application')
      throw err
    }
  }

  async function deleteJob(id) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id)
      if (error) throw error
      // Remove the deleted job from local state immediately (no re-fetch needed).
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Application removed')
    } catch (err) {
      toast.error(err.message || 'Failed to delete application')
      throw err
    }
  }

  // OPTIMISTIC UPDATE: update local state first so the drag-and-drop animation
  // completes instantly, then sync to the database. If the DB write fails, we
  // refetch the server's real data to roll back the optimistic change.
  async function updateJobStatus(id, status) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
    try {
      await updateJob(id, { status })
    } catch {
      fetchJobs()
    }
  }

  return { jobs, loading, error, createJob, updateJob, deleteJob, updateJobStatus, refetch: fetchJobs }
}
