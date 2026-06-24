// src/main.jsx
//
// Application entry point. Mounts React into the DOM and sets up the global
// provider tree that every component depends on.
//
// PROVIDER ORDER MATTERS:
//   BrowserRouter must wrap everything so React Router's hooks (useNavigate,
//   useLocation, etc.) work anywhere in the tree.
//   AuthProvider must be inside BrowserRouter because AuthContext's logout
//   handler may eventually call navigate() (and because it uses Supabase's
//   onAuthStateChange which fires redirects).
//   App is inside AuthProvider so route guards can call useAuth().
//
// StrictMode renders components twice in development to surface side effects
// and deprecated API usage. It has NO effect in production builds.
//
// react-hot-toast's <Toaster> is placed at the app root (outside routes) so
// toast notifications persist across page transitions. The custom styles
// match the dark slate theme — default white toasts would look out of place.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1e293b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
