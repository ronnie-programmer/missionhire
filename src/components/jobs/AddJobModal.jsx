// src/components/jobs/AddJobModal.jsx
//
// Modal form for creating a new job application. Resets its form state on every
// close so it always opens fresh for the next entry.
//
// AUTO-DETECT SOURCE FROM URL:
//   When the user pastes a URL into the job_url field, the set('job_url') handler
//   calls detectPlatformFromUrl() on the value. If a known platform domain is found
//   AND the source hasn't been manually selected yet, it auto-fills the source
//   dropdown. This saves the user a step for the most common case.
//
// EMPTY STRING → NULL:
//   Optional fields are converted from empty strings ('') to null before sending
//   to Supabase. PostgreSQL stores empty strings and NULLs differently — NULL is
//   the correct "not provided" value for optional columns with no data.
//
// FORM RESET:
//   handleClose() resets both form state and errors. This ensures a stale partial
//   form doesn't reappear if the user opens the modal again after canceling.
//
// INITIAL STATE object is defined outside the component so it is a stable reference
// and doesn't get recreated on every render.

import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { PLATFORMS, detectPlatformFromUrl } from '../../utils/platformUtils'

const INITIAL = {
  company: '', role_title: '', job_url: '',
  status: 'saved', applied_date: '', salary_range: '', notes: '',
  source: '', contact_name: '', contact_email: '', follow_up_date: '',
}

export default function AddJobModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => {
      const value = e.target.value
      setForm((p) => {
        const next = { ...p, [field]: value }
        if (field === 'job_url' && value) {
          const detected = detectPlatformFromUrl(value)
          if (detected && !p.source) next.source = detected
        }
        return next
      })
    }
  }

  function validate() {
    const errs = {}
    if (!form.company.trim()) errs.company = 'Company name is required'
    if (!form.role_title.trim()) errs.role_title = 'Role title is required'
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
      await onCreate({
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
      setForm(INITIAL)
      onClose()
    } catch {
      // error already toasted by useJobs
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setForm(INITIAL)
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Application">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Company *" id="add-company" value={form.company} onChange={set('company')} error={errors.company} placeholder="e.g. Lockheed Martin" autoFocus />
        <Input label="Role Title *" id="add-role" value={form.role_title} onChange={set('role_title')} error={errors.role_title} placeholder="e.g. Systems Engineer" />
        <Input label="Job URL" id="add-url" type="url" value={form.job_url} onChange={set('job_url')} error={errors.job_url} placeholder="https://..." />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="add-status" className="text-sm font-medium text-slate-300">Status</label>
            <select id="add-status" value={form.status} onChange={set('status')}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['saved','applied','interviewing','offer','rejected'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <Input label="Applied Date" id="add-date" type="date" value={form.applied_date} onChange={set('applied_date')} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="add-source" className="text-sm font-medium text-slate-300">Source</label>
          <select id="add-source" value={form.source} onChange={set('source')}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Select platform —</option>
            {Object.entries(PLATFORMS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Contact Name" id="add-contact-name" value={form.contact_name} onChange={set('contact_name')} placeholder="Recruiter / hiring mgr" />
          <Input label="Contact Email" id="add-contact-email" type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="recruiter@company.com" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Salary Range" id="add-salary" value={form.salary_range} onChange={set('salary_range')} placeholder="e.g. $80k – $110k" />
          <Input label="Follow-up Date" id="add-followup" type="date" value={form.follow_up_date} onChange={set('follow_up_date')} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="add-notes" className="text-sm font-medium text-slate-300">Notes</label>
          <textarea id="add-notes" rows={3} value={form.notes} onChange={set('notes')}
            placeholder="Referral, next steps, interview tips..."
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Application</Button>
        </div>
      </form>
    </Modal>
  )
}
