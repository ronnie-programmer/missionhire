// src/components/ai/MatchScore.jsx
//
// Scores the user's fit for a specific job against their saved profile.
// Calls the `match-job` Edge Function which uses Claude Sonnet to analyze
// the job description against the user's skills, experience, and background.
//
// PROPS:
//   company — used in the prompt so Claude knows which employer it's evaluating
//   role    — used in the prompt for context about the position
//
// SCORING WITHOUT A PROFILE:
//   toApiProfile() returns null if no profile exists. The Edge Function handles
//   this gracefully: it explicitly tells Claude to "score based on job quality
//   alone" (i.e., evaluate the role's general desirability). This means the
//   feature still works for users who skipped profile setup — they get a quality
//   score rather than a personalized fit score.
//
// RESULT STRUCTURE FROM THE API:
//   { score, summary, matchingSkills, strengths, gaps, recommendation }
//   - score: 0–100 integer
//   - recommendation: "Apply" | "Consider" | "Pass" — provides a decision signal
//   - The color of the score number changes at 75 (green) and 50 (yellow) thresholds,
//     matching the ScoreBadge color bands in JobResultCard.
//
// RecommendationBadge:
//   Maps the "Apply" / "Consider" / "Pass" string to a color-coded pill.
//   The default fallback to 'Consider' styling handles unexpected values safely.

import { useState } from 'react'
import axios from 'axios'
import { Sparkles, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'
import { SUPABASE_FUNCTIONS_URL } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'

function RecommendationBadge({ rec }) {
  const config = {
    Apply: 'bg-green-600/20 text-green-300 border-green-600/40',
    Consider: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40',
    Pass: 'bg-red-600/20 text-red-300 border-red-600/40',
  }
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${config[rec] || config.Consider}`}>
      {rec === 'Apply' ? '✓ Apply' : rec === 'Pass' ? '✗ Pass' : '~ Consider'}
    </span>
  )
}

export default function MatchScore({ company, role }) {
  const { toApiProfile, loading: profileLoading } = useProfile()
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    if (!jobDescription.trim()) { toast.error('Paste the job description first'); return }
    setLoading(true)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Session expired. Please log in again.'); return }
      const res = await axios.post(
        `${SUPABASE_FUNCTIONS_URL}/match-job`,
        { jobDescription, company, role, userProfile: toApiProfile() },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      setResult(res.data.result)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Match failed')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result?.score >= 75
    ? 'text-green-400'
    : result?.score >= 50
      ? 'text-yellow-400'
      : 'text-red-400'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        {profileLoading
          ? 'Loading your profile...'
          : toApiProfile()
            ? 'AI will score this job against your saved profile.'
            : 'Set up your profile for a personalized match score. Without a profile, AI scores based on job quality alone.'}
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Job Description *</label>
        <textarea
          rows={6}
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <Button onClick={analyze} loading={loading} disabled={!jobDescription.trim()}>
        <Sparkles size={14} />
        Score My Match
      </Button>

      {result && (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-bold ${scoreColor}`}>{result.score}</span>
              <span className="text-slate-400 text-sm">/ 100</span>
            </div>
            {result.recommendation && <RecommendationBadge rec={result.recommendation} />}
          </div>

          {result.summary && (
            <p className="text-sm text-slate-300 italic border-l-2 border-indigo-500 pl-3">
              {result.summary}
            </p>
          )}

          {result.matchingSkills?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={13} className="text-green-400" />
                <span className="text-sm font-semibold text-slate-300">Matching Skills</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.matchingSkills.map((s, i) => (
                  <span key={i} className="text-xs bg-green-600/15 text-green-300 border border-green-600/30 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.strengths?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} className="text-indigo-400" />
                <span className="text-sm font-semibold text-slate-300">Your Strengths</span>
              </div>
              <ul className="flex flex-col gap-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-indigo-400 flex-shrink-0">+</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.gaps?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={13} className="text-yellow-400" />
                <span className="text-sm font-semibold text-slate-300">Gaps to Address</span>
              </div>
              <ul className="flex flex-col gap-1">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-yellow-400 flex-shrink-0">–</span>{g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
