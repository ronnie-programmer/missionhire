import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')

  function validate() {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Must be at least 8 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await register(form.email, form.password)
      setConfirmedEmail(form.email)
      setSuccess(true)
    } catch (err) {
      const msg = err.message || 'Registration failed'
      if (msg.includes('already registered')) {
        setErrors({ email: 'This email is already registered' })
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
          <p className="text-slate-400 text-sm">
            We sent a confirmation link to{' '}
            <span className="text-slate-300 font-medium">{confirmedEmail}</span>.
            Click it to activate your account.
          </p>
          <Link to="/login" className="inline-block mt-6 text-sm text-indigo-400 hover:text-indigo-300">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
            <Briefcase size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MissionHire</h1>
          <p className="text-slate-400 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" id="email" type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              error={errors.email} placeholder="you@example.com" autoFocus />
            <Input label="Password" id="password" type="password" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              error={errors.password} placeholder="Min. 8 characters" />
            <Input label="Confirm Password" id="confirm" type="password" value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              error={errors.confirm} placeholder="Re-enter password" />
            <Button type="submit" loading={loading} className="mt-2 w-full" size="lg">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
