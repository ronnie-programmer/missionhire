// src/pages/DashboardPage.jsx
//
// Main job tracker dashboard. Combines the Kanban board, search/filter, stats
// summary, and CRUD modals in one view.
//
// STATE MANAGED HERE (not in a hook):
//   - search: the filter string for client-side job filtering
//   - showAdd: controls AddJobModal visibility
//   - editingJob: the job object being edited (null = modal closed)
//   - deletingJob: the job to confirm-delete (null = dialog closed)
//   These are UI-layer concerns, not data concerns, so they belong in this component
//   rather than in useJobs.
//
// CLIENT-SIDE FILTERING:
//   The `filtered` array is derived from `jobs` on every render by searching
//   company, role_title, and notes fields. This runs entirely in the browser —
//   no extra DB query for each keystroke. This is fine at typical job tracker scale
//   (tens to hundreds of rows). At thousands of rows, server-side filtering would
//   be more appropriate.
//
// DELETE FLOW:
//   Deletion goes through a two-step confirm dialog to prevent accidental deletes.
//   setDeletingJob(job) → opens ConfirmDialog → handleDeleteConfirm() → deleteJob()
//   The EditJobModal also routes deletions through this same ConfirmDialog by calling
//   setDeletingJob and closing itself first.
//
// USERNAME DISPLAY:
//   user.email.split('@')[0] extracts the part before the @ as a quick display name.
//   The app doesn't require a separate full_name field just to greet the user.

import { useState } from 'react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { useJobs } from '../hooks/useJobs'
import { useAuth } from '../context/AuthContext'
import KanbanBoard from '../components/jobs/KanbanBoard'
import AddJobModal from '../components/jobs/AddJobModal'
import EditJobModal from '../components/jobs/EditJobModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatsBar from '../components/ui/StatsBar'
import PlatformSearch from '../components/jobs/PlatformSearch'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function DashboardPage() {
  const { user } = useAuth()
  const { jobs, loading, error, createJob, updateJob, deleteJob, updateJobStatus, refetch } = useJobs()

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [deletingJob, setDeletingJob] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = jobs.filter(job => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      job.company.toLowerCase().includes(q) ||
      job.role_title.toLowerCase().includes(q) ||
      (job.notes && job.notes.toLowerCase().includes(q))
    )
  })

  async function handleDeleteConfirm() {
    if (!deletingJob) return
    setDeleteLoading(true)
    try {
      await deleteJob(deletingJob.id)
      setDeletingJob(null)
    } catch {} finally {
      setDeleteLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <Button variant="secondary" onClick={refetch}>
          <RefreshCw size={14} /> Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Tracker</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Welcome back, {user?.email?.split('@')[0]}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} />
          Add Application
        </Button>
      </div>

      {!loading && <StatsBar jobs={jobs} />}

      <PlatformSearch />

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by company, role, or notes..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-4 py-2 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <KanbanBoard
          jobs={filtered}
          onAddJob={() => setShowAdd(true)}
          onEditJob={setEditingJob}
          onDeleteJob={setDeletingJob}
          onStatusChange={updateJobStatus}
        />
      )}

      <AddJobModal isOpen={showAdd} onClose={() => setShowAdd(false)} onCreate={createJob} />

      <EditJobModal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        job={editingJob}
        onUpdate={updateJob}
        onDelete={(id) => {
          setDeletingJob(jobs.find(j => j.id === id))
          setEditingJob(null)
        }}
      />

      <ConfirmDialog
        isOpen={!!deletingJob}
        onClose={() => setDeletingJob(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Application"
        message={deletingJob ? `Delete your application to ${deletingJob.company}? This cannot be undone.` : ''}
      />
    </div>
  )
}
