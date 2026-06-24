// src/components/ui/PlatformBadge.jsx
//
// Color-coded pill badge that displays the job platform a listing came from
// (LinkedIn, Indeed, Glassdoor, Monster, Direct, or Other).
//
// The badge looks up the platform's styling config from PLATFORMS in platformUtils.js.
// If the source is unknown or absent, the component returns null (renders nothing)
// rather than showing a broken or generic badge.
//
// The small colored dot (w-1.5 h-1.5 rounded-full) mirrors the dots used on
// Kanban column headers in STATUS_CONFIG, creating visual consistency between
// the two badge patterns in the app.

import { PLATFORMS } from '../../utils/platformUtils'

export default function PlatformBadge({ source, className = '' }) {
  if (!source || !PLATFORMS[source]) return null
  const { label, textColor, bgColor, borderColor, dotColor } = PLATFORMS[source]
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${bgColor} ${textColor} ${borderColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      {label}
    </span>
  )
}
