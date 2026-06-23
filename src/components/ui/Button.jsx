import Spinner from './Spinner'

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
  danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30',
  ghost: 'hover:bg-slate-700 text-slate-400 hover:text-slate-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-150 focus:outline-none focus:ring-2
        focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
