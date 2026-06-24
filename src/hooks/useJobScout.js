import { useState } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { SUPABASE_FUNCTIONS_URL } from '../utils/constants'
import toast from 'react-hot-toast'

export function useJobScout() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  async function scout({ query, location, remoteOnly, userProfile }) {
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.post(
        `${SUPABASE_FUNCTIONS_URL}/scout-jobs`,
        { query, location, remoteOnly, userProfile },
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          timeout: 30000,
        }
      )
      setResults(res.data.jobs || [])
      setSearched(true)
      const count = res.data.jobs?.length || 0
      if (count === 0) toast('No jobs found. Try a broader search.', { icon: '🔍' })
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Scout failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, error, searched, scout }
}
