import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const JOB_QUERY = 'subject:(interview OR "job offer" OR "application received" OR "we received your application" OR "thank you for applying" OR hiring OR recruiter) newer_than:60d'

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.provider_token) {
        setProviderToken(session.provider_token)
        setConnected(true)
      }
    })

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
