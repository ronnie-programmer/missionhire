import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-9xl font-black text-slate-800 select-none">404</p>
        <h2 className="text-xl font-bold text-white mt-2 mb-1">Page not found</h2>
        <p className="text-slate-400 text-sm mb-6">That page doesn&apos;t exist.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Home size={15} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
