import { useState } from 'react'
import { ExternalLink, Mail, CheckCircle2, RefreshCw, Inbox, AlertTriangle } from 'lucide-react'
import { useGmail } from '../hooks/useGmail'
import { PLATFORMS, SEARCHABLE_PLATFORMS } from '../utils/platformUtils'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const CATEGORY_CONFIG = {
  offer:     { label: 'Offer',     color: 'text-green-400',  bg: 'bg-green-600/10',  border: 'border-green-600/30' },
  interview: { label: 'Interview', color: 'text-blue-400',   bg: 'bg-blue-600/10',   border: 'border-blue-600/30' },
  rejected:  { label: 'Rejected',  color: 'text-red-400',    bg: 'bg-red-600/10',    border: 'border-red-600/30' },
  received:  { label: 'Received',  color: 'text-slate-400',  bg: 'bg-slate-700/30',  border: 'border-slate-600/30' },
}

function EmailRow({ email }) {
  const cfg = CATEGORY_CONFIG[email.category] || CATEGORY_CONFIG.received
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50 last:border-0">
      <span className={`mt-0.5 text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
        {cfg.label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{email.subject}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{email.from}</p>
      </div>
      <span className="text-xs text-slate-600 flex-shrink-0 hidden sm:block">
        {email.date ? new Date(email.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
      </span>
    </div>
  )
}

function GmailCard() {
  const { connected, scanning, emails, connect, scanInbox } = useGmail()
  const [connectLoading, setConnectLoading] = useState(false)

  async function handleConnect() {
    setConnectLoading(true)
    try {
      await connect()
    } catch {
      setConnectLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center">
            <Mail size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Gmail</h3>
            <p className="text-xs text-slate-400">Scan for job-related emails</p>
          </div>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-600/10 border border-green-600/30 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} />
            Connected
          </span>
        ) : (
          <Button size="sm" onClick={handleConnect} loading={connectLoading}>
            Connect Gmail
          </Button>
        )}
      </div>

      {connected && (
        <>
          <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg px-3 py-2 flex gap-2 text-xs text-amber-400">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span>Read-only access. MissionHire never sends emails or modifies your inbox.</span>
          </div>

          <Button variant="secondary" onClick={scanInbox} loading={scanning} disabled={scanning}>
            {scanning ? 'Scanning...' : <><RefreshCw size={13} /> Scan Inbox</>}
          </Button>

          {emails.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Inbox size={13} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-400">{emails.length} job-related emails</span>
              </div>
              <div className="bg-slate-900 rounded-lg border border-slate-700 px-3 max-h-72 overflow-y-auto">
                {emails.map((email) => (
                  <EmailRow key={email.id} email={email} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!connected && (
        <p className="text-xs text-slate-500 leading-relaxed">
          Connect your Google account to scan for interview invites, offer letters, rejections, and other
          job-related emails from the past 60 days. Requires Google OAuth — you may need to enable
          the Google provider in your Supabase project settings.
        </p>
      )}
    </div>
  )
}

function PlatformCard({ platformKey }) {
  const { label, textColor, bgColor, borderColor, searchUrl } = PLATFORMS[platformKey]
  const [query, setQuery] = useState('')

  function open() {
    if (!searchUrl || !query.trim()) return
    window.open(searchUrl(query.trim()), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${bgColor} ${borderColor}`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-sm ${textColor}`}>{label}</h3>
        <span className="text-xs text-slate-500">Job Board</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && open()}
          placeholder={`Search ${label}...`}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={open}
          disabled={!query.trim()}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
            ${textColor} ${bgColor} border ${borderColor}
            disabled:opacity-40 hover:opacity-80 active:scale-95`}
        >
          <ExternalLink size={12} />
          Go
        </button>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-slate-400 text-sm mt-0.5">Connect your accounts and search job boards directly from MissionHire.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Email</h2>
        <GmailCard />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Job Boards</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {SEARCHABLE_PLATFORMS.map((key) => (
            <PlatformCard key={key} platformKey={key} />
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-300">Database Setup Required</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          To save source, contact, and follow-up date fields, run this migration in your Supabase SQL editor:
        </p>
        <pre className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-400 overflow-x-auto whitespace-pre">
{`ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS source        TEXT,
  ADD COLUMN IF NOT EXISTS contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE;`}
        </pre>
      </div>
    </div>
  )
}
