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
