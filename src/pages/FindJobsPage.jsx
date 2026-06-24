// src/pages/FindJobsPage.jsx
//
// AI-powered job discovery page. Users enter a search query, the app calls the
// `scout-jobs` Edge Function which fetches from Remotive + The Muse APIs and
// batch-scores results with Claude Haiku, then displays them ranked by fit.
//
// PROFILE-AWARE DEFAULTS:
//   If the user has a saved profile, the search inputs are pre-populated with
//   their target role and location as placeholder text (shown when fields are empty).
//   When submitting, empty fields fall back to profile values — profile.target_roles[0]
//   or 'software engineer' — so even a blank search uses the user's preferences.
//
// LOADING MESSAGE ANIMATION (useLoadingMessage):
//   This custom inline hook cycles through LOADING_MESSAGES every 2 seconds while
//   the scout request is in flight. It gives users feedback on what the backend is
//   doing (fetching listings → scoring with AI) during what can be a 10-20 second wait.
//   NOTE: The interval is started directly during render (not in a useEffect) —
//   this works but is unconventional. A useEffect would be the stricter approach.
//
// THREE EMPTY STATES:
//   1. !searched && !loading: initial page load — prompt the user to search
//   2. searched && results.length === 0: search ran but found nothing
//   3. results.length > 0: show the grid of JobResultCard components
//
// ADDING TO TRACKER:
//   handleAddToTracker() calls createJob() from useJobs to insert a new row in
//   job_applications with status='saved'. The `addingId` state tracks which card
//   is currently being added so its button shows a loading state.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, AlertCircle, Briefcase } from 'lucide-react'
import { useJobScout } from '../hooks/useJobScout'
import { useProfile } from '../hooks/useProfile'
import { useJobs } from '../hooks/useJobs'
import JobResultCard from '../components/jobs/JobResultCard'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const LOADING_MESSAGES = [
  'Searching job boards...',
  'Fetching live listings...',
  'Scoring matches with AI...',
  'Ranking results for you...',
]

function useLoadingMessage(loading) {
  const [idx, setIdx] = useState(0)
  const [started, setStarted] = useState(false)

  if (loading && !started) {
    setStarted(true)
    setIdx(0)
    const interval = setInterval(() => setIdx(i => {
      if (i >= LOADING_MESSAGES.length - 1) { clearInterval(interval); return i }
      return i + 1
    }), 2000)
  } else if (!loading && started) {
    setStarted(false)
  }

  return LOADING_MESSAGES[idx]
}

export default function FindJobsPage() {
  const { profile, loading: profileLoading, toApiProfile } = useProfile()
  const { results, loading, searched, scout } = useJobScout()
  const { createJob } = useJobs()
  const [addingId, setAddingId] = useState(null)

  const loadingMsg = useLoadingMessage(loading)

  const [form, setForm] = useState({
    query: '',
    location: '',
    remoteOnly: false,
  })

  function set(field) {
    return (e) => setForm(p => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  }

  async function handleScout(e) {
    e.preventDefault()
    await scout({
      query: form.query || profile?.target_roles?.[0] || 'software engineer',
      location: form.location || profile?.location || '',
      remoteOnly: form.remoteOnly,
      userProfile: toApiProfile(),
    })
  }

  async function handleAddToTracker(job) {
    setAddingId(job.id)
    try {
      await createJob({
        company: job.company,
        role_title: job.title,
        job_url: job.url || null,
        status: 'saved',
        source: job.source?.toLowerCase() === 'remotive' ? 'other' : 'other',
        notes: `Found via AI Scout\n${job.headline || ''}\n${job.salary ? `Salary: ${job.salary}` : ''}`.trim(),
      })
      toast.success(`${job.title} at ${job.company} added to tracker!`)
    } catch {} finally {
      setAddingId(null)
    }
  }

  const hasProfile = !profileLoading && profile && (profile.skills?.length > 0 || profile.target_roles?.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Find Jobs with AI</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Scout searches real job boards and scores each result against your profile.
          </p>
        </div>
      </div>

      {!profileLoading && !hasProfile && (
        <div className="bg-indigo-600/10 border border-indigo-600/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-indigo-300 font-medium">Set up your profile for personalized match scores</p>
            <p className="text-xs text-indigo-400/80 mt-0.5">
              Without a profile, AI still finds jobs but can&apos;t score them against your skills.{' '}
              <Link to="/profile" className="underline hover:text-indigo-300">Complete your profile →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleScout} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Job Title / Keywords</label>
            <input
              type="text"
              value={form.query}
              onChange={set('query')}
              placeholder={profile?.target_roles?.[0] || 'e.g. Software Engineer, React Developer'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder={profile?.location || 'e.g. Austin TX, Remote'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.remoteOnly}
              onChange={set('remoteOnly')}
              className="rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-300">Remote only</span>
          </label>
          <Button type="submit" loading={loading} disabled={loading}>
            <Search size={14} />
            {loading ? 'Scouting...' : 'Scout Jobs with AI'}
          </Button>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm animate-pulse">{loadingMsg}</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {results.length} jobs found
              {hasProfile && ' — sorted by AI match score'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(job => (
              <JobResultCard
                key={job.id}
                job={job}
                onAddToTracker={handleAddToTracker}
                adding={addingId === job.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty State after search */}
      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Briefcase size={20} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">No jobs found. Try a broader search term.</p>
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center">
            <Search size={24} className="text-indigo-400" />
          </div>
          <p className="text-white font-medium">Ready to scout</p>
          <p className="text-slate-500 text-sm max-w-sm">
            Enter a job title and click "Scout Jobs with AI" to search real job boards and get personalized match scores.
          </p>
        </div>
      )}
    </div>
  )
}
