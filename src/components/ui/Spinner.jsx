// src/components/ui/Spinner.jsx
//
// Animated loading indicator used across the app wherever async operations
// are in progress (page load, form submission, AI API calls, etc.).
//
// The spin animation comes from Tailwind's built-in `animate-spin` utility.
// The visual effect is achieved with a full-ring border (border-slate-600)
// except for one side (border-t-indigo-500), creating a "C" shape that spins.
//
// Three sizes let callers choose the right visual weight:
//   sm — inside buttons (next to button text)
//   md — inline within content areas
//   lg — full-screen or section-level loading states

export default function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-2',
  }
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-slate-600 border-t-indigo-500`} />
  )
}
