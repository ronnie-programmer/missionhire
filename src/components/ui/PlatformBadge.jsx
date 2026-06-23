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
