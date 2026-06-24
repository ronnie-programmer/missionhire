// src/components/jobs/JobCard.jsx
//
// Draggable Kanban card representing a single job application.
//
// Draggable from @hello-pangea/dnd makes this element draggable.
//   - draggableId={job.id} is a stable unique identifier for the library to track.
//   - index={index} is the card's position within its column — required by the library.
//   - The render prop `{(provided, snapshot) => ...}` attaches drag event listeners,
//     styles, and aria attributes to the element via provided.draggableProps and
//     provided.dragHandleProps (spread onto the same element here for simplicity).
//
// CLICK VS. DRAG:
//   The card's onClick opens the edit modal. The delete button uses e.stopPropagation()
//   so clicking the trash icon doesn't also trigger the card's onClick. This is a
//   common pattern for nested interactive elements.
//
// PLATFORM DETECTION:
//   If job.source is not set, detectPlatformFromUrl() inspects the job URL to
//   infer the platform. This handles imported applications where source wasn't
//   explicitly set.
//
// DATE FORMATTING:
//   The date string from Postgres (e.g. "2025-03-15") is appended with T00:00:00
//   before passing to Date() to force local-time parsing. Without this, browsers
//   interpret bare YYYY-MM-DD as UTC midnight, which shifts the displayed date by
//   one day in negative UTC offset timezones.
//
// DRAG VISUAL:
//   snapshot.isDragging applies a rotation + scale + shadow effect to give tactile
//   feedback that the card is being held and moved.

import { Draggable } from '@hello-pangea/dnd'
import { ExternalLink, Trash2, Calendar, DollarSign, Bell, User } from 'lucide-react'
import PlatformBadge from '../ui/PlatformBadge'
import { detectPlatformFromUrl } from '../../utils/platformUtils'

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function JobCard({ job, index, onEdit, onDelete }) {
  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(job)}
          className={`
            bg-slate-800 rounded-lg border p-3.5 cursor-pointer
            transition-all duration-150 group select-none
            ${snapshot.isDragging
              ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 rotate-1 scale-105'
              : 'border-slate-700 hover:border-slate-600'
            }
          `}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{job.company}</p>
              <p className="text-slate-400 text-xs truncate mt-0.5">{job.role_title}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(job) }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400
                hover:bg-red-400/10 rounded p-1 transition-all flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {(job.source || (job.job_url && detectPlatformFromUrl(job.job_url))) && (
              <PlatformBadge source={job.source || detectPlatformFromUrl(job.job_url)} />
            )}
            {job.contact_name && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <User size={11} />
                {job.contact_name}
              </span>
            )}
            {job.applied_date && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar size={11} />
                {formatDate(job.applied_date)}
              </span>
            )}
            {job.follow_up_date && (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Bell size={11} />
                Follow up {formatDate(job.follow_up_date)}
              </span>
            )}
            {job.salary_range && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <DollarSign size={11} />
                {job.salary_range}
              </span>
            )}
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <ExternalLink size={11} />
                View Job
              </a>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
