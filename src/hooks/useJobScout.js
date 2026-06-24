// src/hooks/useJobScout.js
//
// Custom hook that calls the `scout-jobs` Edge Function to search real job boards
// and score results against the user's profile via Claude AI.
//
// WHY axios INSTEAD OF fetch?
//   axios automatically parses JSON responses and formats errors with a consistent
//   `err.response.data` structure, making error handling simpler. It also handles
//   setting Content-Type automatically.
//
// AUTH FOR EDGE FUNCTIONS:
//   Unlike direct Supabase table queries (which authenticate via the client's
//   stored JWT), Supabase Edge Functions require an explicit Authorization header.
//   We retrieve the current session first, then attach the access token as a
//   Bearer token. The Edge Function verifies this token server-side.
//
// TIMEOUT:
//   30 seconds is long but intentional — the scout function fetches from two
//   external APIs (Remotive and The Muse) and then calls the Claude AI API for
//   batch scoring. This can take 10–20 seconds in real conditions.
//
// Returns: { results, loading, error, searched, scout }
//   `searched` tracks whether the user has run at least one search (used to
//   distinguish "initial empty state" from "search ran but found nothing").

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
      // Fetch the current JWT access token — needed for the Authorization header.
      // This is separate from how Supabase table queries work (they embed the token
      // automatically), because Edge Functions are plain HTTP endpoints.
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.post(
        `${SUPABASE_FUNCTIONS_URL}/scout-jobs`,
        { query, location, remoteOnly, userProfile },
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          // 30s timeout because this function fetches two external APIs AND calls Claude.
          timeout: 30000,
        }
      )
      setResults(res.data.jobs || [])
      setSearched(true)
      const count = res.data.jobs?.length || 0
      if (count === 0) toast('No jobs found. Try a broader search.', { icon: '🔍' })
    } catch (err) {
      // axios wraps HTTP error responses in err.response.data — check that first
      // before falling back to the generic err.message.
      const msg = err.response?.data?.error || err.message || 'Scout failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, error, searched, scout }
}
