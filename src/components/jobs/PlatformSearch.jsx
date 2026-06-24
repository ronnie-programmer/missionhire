// src/components/jobs/PlatformSearch.jsx
//
// Quick-search widget on the Dashboard that opens job board search results in
// new browser tabs — no server requests, no API keys needed.
//
// HOW IT WORKS:
//   Each SEARCHABLE_PLATFORM has a searchUrl(query) function defined in platformUtils.js
//   that constructs the platform's job search URL. Clicking a platform button calls
//   window.open() with that URL, opening it in a new tab.
//
//   "Search All" iterates SEARCHABLE_PLATFORMS and opens every platform at once.
//   This is a power-user feature — opening 4 tabs simultaneously.
//
// KEYBOARD SUPPORT:
//   Pressing Enter in the input fires handleKeyDown which calls "Search All",
//   making the widget keyboard-accessible without clicking any button.
//
// WHY NOT call the API from here?
//   This widget is intentionally "dumb" — it delegates the actual search to the
//   native job board UIs, which are more featureful and have their own filters.
//   The AI-powered search on /find-jobs is the integration for automated scoring.

import { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import { PLATFORMS, SEARCHABLE_PLATFORMS } from '../../utils/platformUtils'

export default function PlatformSearch() {
  const [query, setQuery] = useState('')

  function openSearch(platformKey) {
    const cfg = PLATFORMS[platformKey]
    if (!cfg?.searchUrl || !query.trim()) return
    window.open(cfg.searchUrl(query.trim()), '_blank', 'noopener,noreferrer')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && query.trim()) {
      SEARCHABLE_PLATFORMS.forEach((key) => openSearch(key))
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Search Job Boards</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "Software Engineer" or "DevSecOps"'
            className="w-full rounded-lg border border-slate-600 bg-slate-900 pl-9 pr-4 py-2 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SEARCHABLE_PLATFORMS.map((key) => {
          const { label, textColor, bgColor, borderColor } = PLATFORMS[key]
          return (
            <button
              key={key}
              onClick={() => openSearch(key)}
              disabled={!query.trim()}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                ${bgColor} ${textColor} ${borderColor}
                disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 active:scale-95`}
            >
              {label}
              <ExternalLink size={11} />
            </button>
          )
        })}
        <button
          onClick={() => SEARCHABLE_PLATFORMS.forEach((k) => openSearch(k))}
          disabled={!query.trim()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
            bg-indigo-600/20 text-indigo-400 border-indigo-600/30
            disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 active:scale-95"
        >
          Search All
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  )
}
