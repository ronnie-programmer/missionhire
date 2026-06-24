// src/pages/LoginPage.jsx
//
// Email/password login page. Users who are already authenticated are redirected
// away from this page by the PublicRoute guard in App.jsx before it even renders.
//
// CLIENT-SIDE VALIDATION:
//   The validate() function runs before calling the API to give instant feedback
//   without a network round trip. It checks the email format with a simple regex
//   and ensures the password field is not empty.
//   WHY NOT rely on browser native validation (required, type="email")?
//   Native validation only runs on form submit, lacks custom error styling, and
//   can't be easily suppressed for programmatic form submission. Our approach
//   gives full control over the error UI.
//
// ERROR HANDLING:
//   Supabase returns specific error message strings for auth failures. We inspect
//   the message to display targeted feedback:
//   - "Email not confirmed" → user registered but hasn't clicked the email link yet
//   - "Invalid login credentials" → wrong email or password (inline field error,
//     not a toast — clearer placement for the user)
//   - anything else → fallback toast notification
//
// After successful login, the onAuthStateChange listener in AuthContext fires,
// updates `user`, and the PublicRoute guard in App.jsx redirects to /dashboard.
// No explicit navigate() call is needed here.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
    } catch (err) {
      const msg = err.message || 'Login failed'
      if (msg.includes('Email not confirmed')) {
        toast.error('Please confirm your email first.')
      } else if (msg.includes('Invalid login credentials')) {
        setErrors({ password: 'Invalid email or password' })
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
            <Briefcase size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MissionHire</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" id="email" type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              error={errors.email} placeholder="you@example.com" autoFocus />
            <Input label="Password" id="password" type="password" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              error={errors.password} placeholder="••••••••" />
            <Button type="submit" loading={loading} className="mt-2 w-full" size="lg">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
