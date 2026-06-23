import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchJobs = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
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

  async function createJob(jobData) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{ ...jobData, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      setJobs(prev => [data, ...prev])
      toast.success('Application added!')
      return data
    } catch (err) {
      toast.error(err.message || 'Failed to add application')
      throw err
    }
  }

  async function updateJob(id, updates) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
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
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Application removed')
    } catch (err) {
      toast.error(err.message || 'Failed to delete application')
      throw err
    }
  }

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
