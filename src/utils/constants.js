export const STATUS_CONFIG = {
  saved: {
    label: 'Saved',
    lightColor: 'bg-slate-600/20',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-600',
    dotColor: 'bg-slate-400',
  },
  applied: {
    label: 'Applied',
    lightColor: 'bg-blue-600/20',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-600',
    dotColor: 'bg-blue-400',
  },
  interviewing: {
    label: 'Interviewing',
    lightColor: 'bg-violet-600/20',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-600',
    dotColor: 'bg-violet-400',
  },
  offer: {
    label: 'Offer',
    lightColor: 'bg-green-600/20',
    textColor: 'text-green-300',
    borderColor: 'border-green-600',
    dotColor: 'bg-green-400',
  },
  rejected: {
    label: 'Rejected',
    lightColor: 'bg-red-600/20',
    textColor: 'text-red-300',
    borderColor: 'border-red-600',
    dotColor: 'bg-red-400',
  },
}

export const STATUSES = Object.keys(STATUS_CONFIG)

export const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
