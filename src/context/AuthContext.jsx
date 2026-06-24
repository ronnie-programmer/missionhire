// src/context/AuthContext.jsx
//
// Global authentication state and helpers, provided to the entire app via React Context.
//
// WHY CONTEXT? Any component that needs the current user (Navbar, protected routes,
// data-fetching hooks) would otherwise need auth passed down as props through every
// intermediate component — "prop drilling." Context solves this by making auth
// available anywhere in the tree without prop drilling.
//
// HOW THE AUTH FLOW WORKS:
//   1. On mount, getSession() reads a persisted session from localStorage (set by
//      Supabase on previous login). This prevents a "flash of unauthenticated content"
//      on page reload.
//   2. onAuthStateChange() listens for subsequent changes — login, logout, token
//      refresh, or the OAuth redirect after email confirmation. This is the reactive
//      half; the component does NOT need to poll.
//   3. The cleanup function returns subscription.unsubscribe() so the listener
//      is removed when the provider unmounts (avoids memory leaks in tests/HMR).
//
// REGISTER vs LOGIN:
//   - register() calls signUp(). Supabase sends a confirmation email; the user is
//     NOT logged in until they click the link. emailRedirectTo tells Supabase where
//     to redirect after confirmation — our /confirm route handles that landing.
//   - login() calls signInWithPassword(). On success, Supabase stores the JWT in
//     localStorage and fires onAuthStateChange, which updates `user` and `session`.
//
// The `loading` flag starts true to prevent protected routes from immediately
// redirecting to /login before the persisted session has been checked.

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // `user` is the Supabase User object (id, email, metadata, etc.)
  // `session` is the full session including the JWT access token — needed when
  //   calling Edge Functions that require Authorization headers.
  // `loading` blocks route guards from rendering before the session is known.
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Step 1: Hydrate from the persisted session (localStorage) on page load.
    // Without this, every refresh would show a spinner while waiting for the
    // auth state event, causing a "flash of login page."
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Step 2: Stay in sync with any future auth changes (login, logout, token refresh,
    // OAuth callback). The `_event` param can be 'SIGNED_IN', 'SIGNED_OUT',
    // 'TOKEN_REFRESHED', etc. — we ignore the event type and just sync state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup: unsubscribe when the provider unmounts to prevent memory leaks.
    return () => subscription.unsubscribe()
  }, [])

  // register() creates the account but does NOT log the user in immediately —
  // Supabase requires email confirmation first. The emailRedirectTo URL must be
  // an allowed redirect URL in the Supabase dashboard's Auth settings.
  async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/confirm` },
    })
    if (error) throw error
    return data
  }

  // login() exchanges email/password for a session. On success, Supabase stores
  // the JWT in localStorage and fires onAuthStateChange above.
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Expose only what consumers need — keeps the API surface small.
  return (
    <AuthContext.Provider value={{ user, session, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// useAuth is a convenience hook that also guards against being called outside
// AuthProvider. Without the guard, context would silently be null and cause
// confusing downstream errors.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
