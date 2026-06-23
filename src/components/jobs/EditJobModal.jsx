import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ConfirmDialog from '../ui/ConfirmDialog'
import CoverLetterGenerator from '../ai/CoverLetterGenerator'
import JDAnalyzer from '../ai/JDAnalyzer'
import { Settings, FileText, Sparkles, Trash2 } from 'lucide-react'
import { PLATFORMS, detectPlatformFromUrl } from '../../utils/platformUtils'

const TABS = [
  { id: 'details', label: 'Details', Icon: Settings },
  { id: 'cover-letter', label: 'Cover Letter', Icon: FileText },
  { id: 'analyze', label: 'Analyze JD', Icon: Sparkles },
]

export default function EditJobModal({ isOpen, onClose, job, onUpdate, onDelete }) {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (job) {
      setForm({
        company: job.company || '',
        role_title: job.role_title || '',
        job_url: job.job_url || '',
        status: job.status || 'saved',
        applied_date: job.applied_date || '',
        salary_range: job.salary_range || '',
        notes: job.notes || '',
        source: job.source || (job.job_url ? detectPlatformFromUrl(job.job_url) : '') || '',
        contact_name: job.contact_name || '',
        contact_email: job.contact_email || '',
        follow_up_date: job.follow_up_date || '',
      })
      setActiveTab('details')
      setErrors({})
    }
  }, [job])

  function set(field) {
    return (e) => {
      const value = e.target.value
      setForm((p) => {
        const next = { ...p, [field]: value }
        if (field === 'job_url' && value && !p.source) {
          next.source = detectPlatformFromUrl(value)
        }
        return next
      })
    }
  }

  function validate() {
    const errs = {}
    if (!form.company?.trim()) errs.company = 'Company name is required'
    if (!form.role_title?.trim()) errs.role_title = 'Role title is required'
    if (form.job_url && !form.job_url.startsWith('http')) errs.job_url = 'URL must start with http://'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await onUpdate(job.id, {
        ...form,
        applied_date: form.applied_date || null,
        salary_range: form.salary_range || null,
        notes: form.notes || null,
        job_url: form.job_url || null,
        source: form.source || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        follow_up_date: form.follow_up_date || null,
      })
      onClose()
    } catch {} finally { setLoading(false) }
  }

  async function handleDeleteConfirm() {
    setDeleteLoading(true)
    try {
      await onDelete(job.id)
      setShowDelete(false)
      onClose()
    } catch {} finally { setDeleteLoading(false) }
  }

  if (!job) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`${job.company} — ${job.role_title}`} size="lg">
        <div className="flex gap-1 mb-5 border-b border-slate-700 -mt-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors
                ${activeTab === id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Company *" id="edit-company" value={form.company} onChange={set('company')} error={errors.company} />
            <Input label="Role Title *" id="edit-role" value={form.role_title} onChange={set('role_title')} error={errors.role_title} />
            <Input label="Job URL" id="edit-url" type="url" value={form.job_url} onChange={set('job_url')} error={errors.job_url} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="edit-status" className="text-sm font-medium text-slate-300">Status</label>
                <select id="edit-status" value={form.status} onChange={set('status')}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['saved','applied','interviewing','offer','rejected'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <Input label="Applied Date" id="edit-date" type="date" value={form.applied_date} onChange={set('applied_date')} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-source" className="text-sm font-medium text-slate-300">Source</label>
              <select id="edit-source" value={form.source} onChange={set('source')}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Select platform —</option>
                {Object.entries(PLATFORMS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Name" id="edit-contact-name" value={form.contact_name} onChange={set('contact_name')} placeholder="Recruiter / hiring mgr" />
              <Input label="Contact Email" id="edit-contact-email" type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="recruiter@company.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Salary Range" id="edit-salary" value={form.salary_range} onChange={set('salary_range')} placeholder="e.g. $80k – $110k" />
              <Input label="Follow-up Date" id="edit-followup" type="date" value={form.follow_up_date} onChange={set('follow_up_date')} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-notes" className="text-sm font-medium text-slate-300">Notes</label>
              <textarea id="edit-notes" rows={3} value={form.notes} onChange={set('notes')}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="danger" onClick={() => setShowDelete(true)}>
                <Trash2 size={13} /> Delete
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button type="submit" loading={loading}>Save Changes</Button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'cover-letter' && (
          <CoverLetterGenerator company={job.company} role={job.role_title} />
        )}

        {activeTab === 'analyze' && (
          <JDAnalyzer />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Application"
        message={`Delete your application to ${job?.company}? This cannot be undone.`}
      />
    </>
  )
}
