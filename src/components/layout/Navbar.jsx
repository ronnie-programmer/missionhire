import { Link, useLocation } from 'react-router-dom'
import { LogOut, Briefcase, Plug, Search, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  async function handleLogout() {
    try {
      await logout()
      toast.success('Logged out')
    } catch (err) {
      toast.error(err.message || 'Logout failed')
    }
  }

  function navClass(path) {
    return `flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
      pathname === path
        ? 'text-white bg-slate-700'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Briefcase size={15} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">MissionHire</span>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/dashboard" className={navClass('/dashboard')}>
                <Briefcase size={14} />
                Tracker
              </Link>
              <Link to="/find-jobs" className={navClass('/find-jobs')}>
                <Search size={14} />
                Find Jobs
              </Link>
              <Link to="/integrations" className={navClass('/integrations')}>
                <Plug size={14} />
                Integrations
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              to="/profile"
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/profile'
                  ? 'text-white bg-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User size={14} />
              <span className="hidden md:inline">Profile</span>
            </Link>
          )}
          {user && (
            <span className="text-sm text-slate-500 hidden md:block truncate max-w-[180px]">
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors hover:bg-slate-800 rounded-lg px-3 py-1.5"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
