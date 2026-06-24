import { useState, useEffect } from 'react'
import { User, Briefcase, MapPin, FileText, Zap } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive']
const REMOTE_OPTIONS = [
  { value: 'remote', label: 'Remote only' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site only' },
  { value: 'open', label: 'Open to any' },
]

function TagPreview({ tags }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((tag, i) => (
        <span key={i} className="text-xs bg-indigo-600/15 text-indigo-300 border border-indigo-600/30 px-2 py-0.5 rounded-full">
          {tag}
        </span>
      ))}
    </div>
  )
}

function parseTags(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

function joinTags(arr) {
  return (arr || []).join(', ')
}

export default function ProfilePage() {
  const { profile, loading, saveProfile } = useProfile()
  const [form, setForm] = useState({
    full_name: '',
    target_roles: '',
    skills: '',
    experience_level: 'Mid',
    location: '',
    remote_preference: 'open',
    resume_text: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        target_roles: joinTags(profile.target_roles),
        skills: joinTags(profile.skills),
        experience_level: profile.experience_level || 'Mid',
        location: profile.location || '',
        remote_preference: profile.remote_preference || 'open',
        resume_text: profile.resume_text || '',
      })
    }
  }, [profile])

  function set(field) {
    return (e) => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveProfile({
        full_name: form.full_name,
        target_roles: parseTags(form.target_roles),
        skills: parseTags(form.skills),
        experience_level: form.experience_level,
        location: form.location,
        remote_preference: form.remote_preference,
        resume_text: form.resume_text,
      })
    } catch {} finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Help the AI scout find jobs that match you and generate better cover letters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basic Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={15} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Basic Info</h2>
          </div>
          <Input label="Full Name" id="full_name" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Experience Level</label>
              <select value={form.experience_level} onChange={set('experience_level')}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Remote Preference</label>
              <select value={form.remote_preference} onChange={set('remote_preference')}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {REMOTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <Input label="Location" id="location" value={form.location} onChange={set('location')} placeholder="e.g. Austin TX, New York NY" />
        </div>

        {/* Target Roles */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={15} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Target Roles</h2>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Job Titles (comma-separated)</label>
            <input
              type="text"
              value={form.target_roles}
              onChange={set('target_roles')}
              placeholder="e.g. Software Engineer, Full Stack Developer, DevOps Engineer"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <TagPreview tags={parseTags(form.target_roles)} />
        </div>

        {/* Skills */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={15} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Skills</h2>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Your Skills (comma-separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={set('skills')}
              placeholder="e.g. React, Python, PostgreSQL, Docker, AWS, TypeScript"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <TagPreview tags={parseTags(form.skills)} />
        </div>

        {/* Resume */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={15} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Resume / Background</h2>
          </div>
          <p className="text-xs text-slate-500">
            Paste your resume text or write a background summary. Used to personalize AI job matching and cover letters.
          </p>
          <textarea
            rows={10}
            value={form.resume_text}
            onChange={set('resume_text')}
            placeholder="Paste your resume here or write a summary of your experience, background, and what you're looking for..."
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <Button type="submit" loading={saving} size="lg">
          Save Profile
        </Button>
      </form>
    </div>
  )
}
