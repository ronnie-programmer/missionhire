// src/components/ui/Input.jsx
//
// Reusable text input component with optional label and inline error message.
//
// The `id` prop is shared between the <label>'s htmlFor and the <input>'s id.
// This linkage is important for accessibility — clicking the label focuses the
// input, and screen readers announce the label when the input is focused.
//
// CONDITIONAL ERROR STYLE:
//   When `error` is truthy the border changes to red (border-red-500) and the
//   error string is displayed below the input. This collapses when error is
//   falsy/undefined — no need for the caller to conditionally render anything.
//
// `...props` spread makes this component a drop-in replacement for <input> —
//   callers can pass type="date", placeholder, autoFocus, onChange, etc.
// without this component needing to know about them explicitly.

export default function Input({ label, error, id, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full rounded-lg border bg-slate-800 px-3 py-2 text-slate-100
          placeholder:text-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-slate-600'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
