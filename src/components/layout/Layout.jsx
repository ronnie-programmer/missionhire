// src/components/layout/Layout.jsx
//
// Shell wrapper used by every authenticated page route in App.jsx.
// Renders the sticky Navbar at the top and the main content area below it.
//
// WHY A LAYOUT COMPONENT?
//   Without a layout wrapper, every page component would have to render its own
//   Navbar and container styles — duplicating markup. Layout centralizes the
//   shared chrome so each page only renders its own content.
//
// max-w-screen-xl with mx-auto keeps content readable on wide monitors by
// capping the content width and centering it.
//
// The layout is NOT used on /login, /register, /confirm, or 404 — those pages
// control their own full-screen centering independently.

import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
