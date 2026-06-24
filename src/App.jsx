// src/App.jsx
//
// Root routing component. Declares every URL path the app can handle and wraps
// each route in the appropriate access guard.
//
// ROUTE GUARD PATTERN — two wrapper components enforce access control:
//
//   ProtectedRoute: only logged-in users may proceed.
//     - While loading (session not yet read from localStorage), shows a full-screen
//       spinner so there's no flash of /login.
//     - If not authenticated, redirects to /login using React Router's <Navigate>
//       with `replace` so the login page doesn't stack on history (pressing Back
//       after login wouldn't navigate back to /login).
//
//   PublicRoute: only logged-OUT users may proceed.
//     - If already logged in, redirects to /dashboard to avoid showing the login
//       or register form to a user who is already authenticated.
//
// WHY CHECK `loading` IN BOTH GUARDS?
//   AuthContext initializes with loading=true. If we checked `user` before the
//   persisted session was resolved, every page refresh would briefly redirect to
//   /login. Showing a spinner instead gives the session check time to complete.
//
// The /confirm route is intentionally unguarded — it's the landing page after
// clicking the email confirmation link and must be reachable before login.
//
// The wildcard "*" route catches any URL not matched above and renders NotFoundPage.

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ConfirmPage from './pages/ConfirmPage'
import DashboardPage from './pages/DashboardPage'
import IntegrationsPage from './pages/IntegrationsPage'
import ProfilePage from './pages/ProfilePage'
import FindJobsPage from './pages/FindJobsPage'
import NotFoundPage from './pages/NotFoundPage'
import Spinner from './components/ui/Spinner'

// ProtectedRoute gates pages that require login.
// It reads from AuthContext — no prop drilling needed — and renders children
// only once a valid session is confirmed.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Spinner size="lg" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

// PublicRoute prevents authenticated users from landing on login/register.
// `replace` keeps browser history clean — navigating to /dashboard from /login
// shouldn't leave /login in the back-button stack.
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Spinner size="lg" />
    </div>
  )
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />

      <Route path="/register" element={
        <PublicRoute><RegisterPage /></PublicRoute>
      } />

      <Route path="/confirm" element={<ConfirmPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><DashboardPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/find-jobs" element={
        <ProtectedRoute>
          <Layout><FindJobsPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/integrations" element={
        <ProtectedRoute>
          <Layout><IntegrationsPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
