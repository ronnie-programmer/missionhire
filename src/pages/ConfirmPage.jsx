// src/pages/ConfirmPage.jsx
//
// Email confirmation landing page. The user arrives here by clicking the link
// in the registration confirmation email that Supabase sends.
//
// HOW EMAIL CONFIRMATION WORKS:
//   Supabase appends the confirmation token to the redirect URL as a URL hash
//   fragment, e.g.: /confirm#access_token=...&type=signup
//   Hash fragments (#) are NOT sent to the server — they are browser-only.
//   This is intentional: the token never travels over the network to our server.
//
// DETECTION LOGIC:
//   1. Check window.location.hash for access_token + type=signup. If found, the
//      confirmation was successful and Supabase has already created the session.
//      We auto-redirect to /dashboard after 2.5 seconds.
//   2. If no hash token (e.g., user navigated here directly), call getSession()
//      to check if they have a valid session from a previous confirmation.
//   3. If neither, show an error — the link may have expired (tokens are one-time use
//      and typically expire after 24 hours) or already been clicked.
//
// THREE UI STATES:
//   'loading' → spinner while we parse the URL / check the session
//   'success' → green check + countdown redirect
//   'error'   → red X + explanation + link back to register

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/ui/Spinner'

export default function ConfirmPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function confirm() {
      try {
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.slice(1))
          const type = params.get('type')
          const accessToken = params.get('access_token')
          if (type === 'signup' && accessToken) {
            setStatus('success')
            setTimeout(() => navigate('/dashboard'), 2500)
            return
          }
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus('success')
          setTimeout(() => navigate('/dashboard'), 2500)
        } else {
          setStatus('error')
          setMessage('Link may have expired or already been used. Please try registering again.')
        }
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Something went wrong')
      }
    }
    confirm()
  }, [navigate])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4"><Spinner size="lg" /></div>
            <p className="text-slate-400">Confirming your account...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email confirmed!</h2>
            <p className="text-slate-400 text-sm">Taking you to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Confirmation failed</h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Try registering again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
