// src/utils/platformUtils.js
//
// Job platform definitions and URL-to-platform detection utility.
//
// PLATFORMS is a registry of every job source the app knows about.
// Each platform entry contains:
//   label       — display name shown in UI badges and dropdowns
//   textColor   — Tailwind class for badge text color
//   borderColor — Tailwind class for badge border color
//   bgColor     — Tailwind class for badge background color
//   dotColor    — Tailwind class for the small indicator dot
//   searchUrl   — function(query) that returns the platform's job search URL,
//                 or null if the platform doesn't support direct search (Direct, Other)
//   domains     — list of URL substrings used by detectPlatformFromUrl() to
//                 identify which platform a job URL belongs to
//
// WHY COMBINE VISUAL CONFIG WITH DATA?
//   Keeping the label, colors, and URL builder together means adding a new
//   platform requires touching exactly one object — no need to synchronize
//   separate arrays or switch statements across the codebase.
//
// SEARCHABLE_PLATFORMS is a subset of platform keys that have searchUrl functions.
// Used by PlatformSearch.jsx and IntegrationsPage.jsx to render search widgets
// only for platforms that support direct search.
//
// detectPlatformFromUrl(url):
//   Iterates platform domains and checks if the URL (lowercased) contains each
//   domain string. Returns the matching platform key or 'direct' as a fallback.
//   Used in AddJobModal and EditJobModal to auto-fill the source field when a
//   user pastes a job URL.

export const PLATFORMS = {
  linkedin: {
    label: 'LinkedIn',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-600/30',
    bgColor: 'bg-blue-600/10',
    dotColor: 'bg-blue-500',
    searchUrl: (q) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}`,
    domains: ['linkedin.com'],
  },
  indeed: {
    label: 'Indeed',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-600/30',
    bgColor: 'bg-indigo-600/10',
    dotColor: 'bg-indigo-500',
    searchUrl: (q) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}`,
    domains: ['indeed.com'],
  },
  monster: {
    label: 'Monster',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-600/30',
    bgColor: 'bg-violet-600/10',
    dotColor: 'bg-violet-500',
    searchUrl: (q) => `https://www.monster.com/jobs/search?q=${encodeURIComponent(q)}`,
    domains: ['monster.com'],
  },
  glassdoor: {
    label: 'Glassdoor',
    textColor: 'text-green-400',
    borderColor: 'border-green-600/30',
    bgColor: 'bg-green-600/10',
    dotColor: 'bg-green-500',
    searchUrl: (q) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}`,
    domains: ['glassdoor.com'],
  },
  direct: {
    label: 'Direct',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-600/30',
    bgColor: 'bg-slate-700/30',
    dotColor: 'bg-slate-500',
    searchUrl: null,
    domains: [],
  },
  other: {
    label: 'Other',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-600/30',
    bgColor: 'bg-slate-700/30',
    dotColor: 'bg-slate-500',
    searchUrl: null,
    domains: [],
  },
}

export const SEARCHABLE_PLATFORMS = ['linkedin', 'indeed', 'monster', 'glassdoor']

export function detectPlatformFromUrl(url) {
  if (!url) return ''
  const lower = url.toLowerCase()
  for (const [key, cfg] of Object.entries(PLATFORMS)) {
    if (cfg.domains.some((d) => lower.includes(d))) return key
  }
  return 'direct'
}
