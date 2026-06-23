import { useState } from 'react'
import axios from 'axios'
import Button from '../ui/Button'
import toast from 'react-hot-toast'
import { CheckCircle, AlertCircle, TrendingUp, Users, Target, Lightbulb } from 'lucide-react'
import { SUPABASE_FUNCTIONS_URL } from '../../utils/constants'
import { supabase } from '../../lib/supabase'

function Tags({ items, colorClass }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>{item}</span>
      ))}
    </div>
  )
}

function Section({ Icon, title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-slate-400" />
        <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function BulletList({ items, colorClass }) {
  if (!items?.length) return null
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item, i) => (
        <li key={i} className={`text-xs flex gap-2 ${colorClass}`}>
          <span className="flex-shrink-0">•</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function JDAnalyzer() {
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    if (!jobDescription.trim()) { toast.error('Paste a job description first'); return }
    setLoading(true)
    setAnalysis(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.post(
        `${SUPABASE_FUNCTIONS_URL}/analyze-job`,
        { jobDescription },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      setAnalysis(res.data.analysis)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        Paste a job description for an AI breakdown of required skills, red flags, and application tips.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Job Description *</label>
        <textarea rows={6} value={jobDescription} onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      <Button onClick={analyze} loading={loading} disabled={!jobDescription.trim()}>
        Analyze Job Description
      </Button>

      {analysis && (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {analysis.experienceLevel && (
              <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-600/30 text-xs px-3 py-1 rounded-full font-medium">
                {analysis.experienceLevel}
              </span>
            )}
            {analysis.estimatedSalary && (
              <span className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full font-medium">
                {analysis.estimatedSalary}
              </span>
            )}
          </div>

          {analysis.overallFit && (
            <p className="text-sm text-slate-300 italic border-l-2 border-indigo-500 pl-3">
              {analysis.overallFit}
            </p>
          )}

          {analysis.requiredSkills?.length > 0 && (
            <Section Icon={CheckCircle} title="Required Skills">
              <Tags items={analysis.requiredSkills} colorClass="bg-blue-600/20 text-blue-300 border border-blue-600/30" />
            </Section>
          )}

          {analysis.niceToHaveSkills?.length > 0 && (
            <Section Icon={TrendingUp} title="Nice to Have">
              <Tags items={analysis.niceToHaveSkills} colorClass="bg-slate-700 text-slate-300 border border-slate-600" />
            </Section>
          )}

          {analysis.keyResponsibilities?.length > 0 && (
            <Section Icon={Target} title="Key Responsibilities">
              <BulletList items={analysis.keyResponsibilities} colorClass="text-slate-400" />
            </Section>
          )}

          {analysis.redFlags?.length > 0 && (
            <Section Icon={AlertCircle} title="Red Flags">
              <BulletList items={analysis.redFlags} colorClass="text-red-400" />
            </Section>
          )}

          {analysis.applicationTips?.length > 0 && (
            <Section Icon={Lightbulb} title="Application Tips">
              <BulletList items={analysis.applicationTips} colorClass="text-green-400" />
            </Section>
          )}

          {analysis.companyCultureHints?.length > 0 && (
            <Section Icon={Users} title="Culture Signals">
              <Tags items={analysis.companyCultureHints} colorClass="bg-violet-600/20 text-violet-300 border border-violet-600/30" />
            </Section>
          )}
        </div>
      )}
    </div>
  )
}
