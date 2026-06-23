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
