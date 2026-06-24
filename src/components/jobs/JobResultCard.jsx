// src/components/jobs/JobResultCard.jsx
//
// Displays a single job result from the AI scout search. Shows match score,
// expandable match details, and a button to add the job to the tracker.
//
// ScoreBadge:
//   The score (0–100) comes from Claude Haiku's batch scoring in the scout-jobs
//   Edge Function. The color bands are:
//     ≥75 → green (strong match)
//     ≥50 → yellow (worth considering)
//     <50  → red (likely a poor fit)
//
// EXPANDABLE MATCH DETAILS:
//   matchReasons and gaps are arrays returned by the AI alongside the score.
//   They are hidden by default to keep the card compact and revealed on demand
//   via the `expanded` toggle. This pattern lets users scan many cards quickly
//   while still being able to drill into the reasoning.
//
// job.source (string like "Remotive" or "The Muse"):
//   This is different from the `source` field on job_applications in the database.
//   Here it identifies which API the listing came from, displayed as a pill badge.
//
// ADDING TO TRACKER:
//   onAddToTracker(job) is called from FindJobsPage which calls createJob() in
//   useJobs. The `adding` prop comes from FindJobsPage's addingId state, which
//   tracks which card is mid-save so only that card's button shows a spinner.

import { useState } from 'react'
import { ExternalLink, Plus, ChevronDown, ChevronUp, MapPin, Wifi } from 'lucide-react'
import Button from '../ui/Button'

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return null
  const color = score >= 75
    ? 'bg-green-600/20 text-green-300 border-green-600/40'
    : score >= 50
      ? 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40'
      : 'bg-red-600/20 text-red-300 border-red-600/40'
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>
      {score}% match
    </span>
  )
}

export default function JobResultCard({ job, onAddToTracker, adding }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-white text-sm truncate">{job.title}</h3>
            <ScoreBadge score={job.score} />
          </div>
          <p className="text-sm text-slate-400">{job.company}</p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full flex-shrink-0">
          {job.source}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {job.location}
        </span>
        {job.remote && (
          <span className="flex items-center gap-1 text-indigo-400">
            <Wifi size={11} />
            Remote
          </span>
        )}
        {job.salary && (
          <span className="text-green-400">{job.salary}</span>
        )}
      </div>

      {job.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.tags.slice(0, 6).map((tag, i) => (
            <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {job.headline && (
        <p className="text-xs text-indigo-300 italic border-l-2 border-indigo-500 pl-2">
          {job.headline}
        </p>
      )}

      {(job.matchReasons?.length > 0 || job.gaps?.length > 0) && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Show'} match details
          </button>
          {expanded && (
            <div className="mt-2 flex flex-col gap-2">
              {job.matchReasons?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-400 mb-1">Why it fits</p>
                  <ul className="flex flex-col gap-0.5">
                    {job.matchReasons.map((r, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-2">
                        <span className="text-green-500 flex-shrink-0">+</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {job.gaps?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-yellow-400 mb-1">Gaps to note</p>
                  <ul className="flex flex-col gap-0.5">
                    {job.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-2">
                        <span className="text-yellow-500 flex-shrink-0">–</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => onAddToTracker(job)}
          loading={adding}
          className="flex-1"
        >
          <Plus size={13} />
          Add to Tracker
        </Button>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
          >
            <ExternalLink size={12} />
            View
          </a>
        )}
      </div>
    </div>
  )
}
