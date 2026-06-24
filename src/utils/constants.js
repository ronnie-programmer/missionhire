// src/utils/constants.js
//
// Application-wide constants for job application statuses and API configuration.
//
// STATUS_CONFIG is the single source of truth for Kanban column appearance.
// Every part of the UI that needs to display or style a status (Kanban columns,
// stats bar, etc.) imports from here. Changing a label or color in this file
// automatically updates the entire app.
//
// STATUS_CONFIG structure per entry:
//   label       — human-readable column name displayed in the UI
//   lightColor  — semi-transparent background for the column header and status badges
//   textColor   — text color for the status label and count
//   borderColor — border color used on cards and column headers
//   dotColor    — color of the small status indicator dot
//
// STATUSES is derived from STATUS_CONFIG using Object.keys() so the order of
// Kanban columns is always determined by the order of entries in STATUS_CONFIG.
// This means reordering columns only requires reordering the config object.
//
// SUPABASE_FUNCTIONS_URL points to the base URL for all Supabase Edge Functions.
// Using an env var instead of hardcoding allows different URLs for dev/prod without
// code changes. Format: https://<project-id>.supabase.co/functions/v1

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
