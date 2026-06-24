// src/hooks/useGmail.js
//
// Custom hook that manages Gmail OAuth connection and inbox scanning.
//
// HOW GMAIL OAUTH WORKS WITH SUPABASE:
//   Supabase supports Google as an OAuth provider. When the user clicks
//   "Connect Gmail", signInWithOAuth() initiates the Google consent screen
//   requesting the gmail.readonly scope. After consent, Google redirects back
//   to /integrations with a session that includes a `provider_token` — this is
//   Google's OAuth access token (not Supabase's JWT). We use this token to call
//   the Gmail REST API directly from the browser.
//
//   NOTE: The `provider_token` is only available immediately after the OAuth
//   redirect. On subsequent page loads it may not be included in getSession(),
//   which is why the connected/scanning/emails state does not persist across
//   hard refreshes in this implementation.
//
// DIRECT GMAIL API CALLS:
//   This is client-side code calling Gmail's REST API directly (no Edge Function
//   proxy). This is safe because we only requested readonly scope and the token
//   is never logged or sent to our own servers.
//
// TWO-STEP FETCH:
//   1. List message IDs matching the job-related query (up to 25 results).
//   2. Fetch each message's metadata in parallel with Promise.all() — limited to
//      15 to avoid rate limiting and keep the UI responsive.
//   We only fetch metadata (headers), NOT the full message body, to minimize
//   data transferred and protect user privacy.
//
// categorize():
//   Simple keyword matching on subject + snippet to bucket emails into
//   offer / interview / rejected / received. A production app might use Claude
//   for smarter classification, but keyword matching is fast and free.
//
// Returns: { connected, scanning, emails, connect, scanInbox }

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// Gmail search query targeting job-related emails from the last 60 days.
// This is standard Gmail query syntax — the same thing you'd type in the search box.
const JOB_QUERY = 'subject:(interview OR "job offer" OR "application received" OR "we received your application" OR "thank you for applying" OR hiring OR recruiter) newer_than:60d'

// Extract display fields from Gmail's metadata format.
// Gmail returns headers as an array of { name, value } objects, not a plain object,
// so we use Array.find() to look up by header name.
function parseEmailHeaders(msg) {
  const headers = msg.payload?.headers || []
  const get = (name) => headers.find((h) => h.name === name)?.value || ''
  return {
    id: msg.id,
    subject: get('Subject') || '(no subject)',
    from: get('From'),
    date: get('Date'),
    snippet: msg.snippet || '',
  }
}

// Keyword-based email categorization. Runs on the subject + snippet (Gmail's
// ~100-char preview) since we don't fetch the full message body.
function categorize(subject, snippet) {
  const text = (subject + ' ' + snippet).toLowerCase()
  if (text.includes('offer') || text.includes('congratulations')) return 'offer'
  if (text.includes('interview') || text.includes('schedule') || text.includes('call')) return 'interview'
  if (text.includes('rejected') || text.includes('not moving forward') || text.includes('decided to move forward with other')) return 'rejected'
  return 'received'
}

export function useGmail() {
  const [connected, setConnected] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [emails, setEmails] = useState([])
  const [providerToken, setProviderToken] = useState(null)

  useEffect(() => {
    // Check for a provider_token on mount — this is present immediately after the
    // Google OAuth redirect, which lands the user back on /integrations.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.provider_token) {
        setProviderToken(session.provider_token)
        setConnected(true)
      }
    })

    // Also listen for auth state changes so the UI updates if the user connects
    // Gmail while already on the integrations page.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.provider_token) {
        setProviderToken(session.provider_token)
        setConnected(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function connect() {
    try {
      // signInWithOAuth redirects the browser to Google's consent screen.
      // scopes: we request only readonly — MissionHire never modifies the inbox.
      // access_type: 'offline' requests a refresh token so the session can be
      //   renewed without the user having to re-consent.
      // prompt: 'consent' forces Google to show the scope screen even if the user
      //   previously authorized — useful during development/testing.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          redirectTo: `${window.location.origin}/integrations`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
    } catch (err) {
      toast.error(err.message || 'Failed to connect Gmail')
      throw err
    }
  }

  async function scanInbox() {
    if (!providerToken) {
      toast.error('Connect Gmail first')
      return
    }
    setScanning(true)
    setEmails([])
    try {
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(JOB_QUERY)}&maxResults=25`,
        { headers: { Authorization: `Bearer ${providerToken}` } }
      )
      if (listRes.status === 401) {
        setConnected(false)
        setProviderToken(null)
        throw new Error('Gmail access expired — please reconnect')
      }
      if (!listRes.ok) throw new Error('Gmail API error: ' + listRes.status)

      const { messages = [] } = await listRes.json()
      if (!messages.length) {
        toast('No job-related emails found in the last 60 days', { icon: '📭' })
        return
      }

      // Fetch metadata for the top 15 results in parallel.
      // format=metadata means we only receive headers, not the email body.
      // This is faster and avoids processing potentially large HTML email bodies.
      // metadataHeaders limits which headers we retrieve — only the three we display.
      const details = await Promise.all(
        messages.slice(0, 15).map(async ({ id }) => {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          )
          return r.json()
        })
      )

      setEmails(
        details.map((msg) => {
          const parsed = parseEmailHeaders(msg)
          return { ...parsed, category: categorize(parsed.subject, parsed.snippet) }
        })
      )
      toast.success(`Found ${Math.min(details.length, 15)} job-related emails`)
    } catch (err) {
      toast.error(err.message || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return { connected, scanning, emails, connect, scanInbox }
}
