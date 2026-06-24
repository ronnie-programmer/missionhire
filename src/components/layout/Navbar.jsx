// src/components/layout/Navbar.jsx
//
// Sticky top navigation bar with active-route highlighting and logout.
//
// ACTIVE ROUTE HIGHLIGHTING:
//   useLocation() returns the current URL pathname. navClass() compares the
//   pathname to each link's path to apply a "selected" style. This is a manual
//   implementation because React Router's <NavLink> component's className API
//   is equivalent but slightly less readable for this pattern.
//
// STICKY + BACKDROP:
//   `sticky top-0 z-40` keeps the navbar visible while scrolling.
//   `bg-slate-900/80 backdrop-blur-md` makes it semi-transparent with a blur
//   effect so page content scrolling under it looks polished.
//
// CONDITIONAL RENDERING:
//   Nav links and the user email are only shown when `user` is truthy — the
//   Navbar is reused across the app including the ConfirmPage where the user
//   may not be authenticated yet. (Though in practice, Layout is only used on
//   protected routes, so `user` will always be set when Navbar renders.)
//
// LOGOUT FLOW:
//   logout() calls supabase.auth.signOut() which clears the session from
//   localStorage. onAuthStateChange fires in AuthContext, sets user to null,
//   which triggers the ProtectedRoute guard to redirect to /login automatically.

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
