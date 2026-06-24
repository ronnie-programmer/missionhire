import { useState, useEffect } from 'react'
import axios from 'axios'
import Button from '../ui/Button'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { SUPABASE_FUNCTIONS_URL } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'

export default function CoverLetterGenerator({ company, role }) {
  const { profile } = useProfile()
  const [jobDescription, setJobDescription] = useState('')
  const [userBackground, setUserBackground] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile?.resume_text && !userBackground) {
      setUserBackground(profile.resume_text.slice(0, 600))
    }
  }, [profile])

  async function generate() {
    if (!jobDescription.trim()) { toast.error('Paste a job description first'); return }
    setLoading(true)
    setCoverLetter('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.post(
        `${SUPABASE_FUNCTIONS_URL}/generate-cover-letter`,
        { jobDescription, company, role, userBackground },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      setCoverLetter(res.data.coverLetter)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        Paste the job description. Claude will write a tailored cover letter for{' '}
        <span className="text-slate-300 font-medium">{role}</span> at{' '}
        <span className="text-slate-300 font-medium">{company}</span>.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Job Description *</label>
        <textarea rows={6} value={jobDescription} onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">
          Your Background
          {profile?.resume_text && <span className="text-indigo-400 text-xs ml-2">(from your profile)</span>}
        </label>
        <textarea rows={3} value={userBackground} onChange={e => setUserBackground(e.target.value)}
          placeholder="Brief summary of your experience to emphasize..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      <Button onClick={generate} loading={loading} disabled={!jobDescription.trim()}>
        Generate Cover Letter
      </Button>

      {coverLetter && (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Result</span>
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{coverLetter}</p>
        </div>
      )}
    </div>
  )
}
