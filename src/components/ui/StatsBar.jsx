import { STATUS_CONFIG, STATUSES } from '../../utils/constants'

export default function StatsBar({ jobs }) {
  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = jobs.filter(j => j.status === status).length
    return acc
  }, {})

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
        <span className="text-2xl font-bold text-white">{jobs.length}</span>
        <span className="text-sm text-slate-400">Total</span>
      </div>
      {STATUSES.map(status => {
        const config = STATUS_CONFIG[status]
        return (
          <div
            key={status}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 border ${config.lightColor} ${config.borderColor}/30`}
          >
            <span className={`text-xl font-bold ${config.textColor}`}>{counts[status]}</span>
            <span className={`text-sm ${config.textColor} opacity-70`}>{config.label}</span>
          </div>
        )
      })}
    </div>
  )
}
