import { type FormEvent, useEffect, useState } from 'react'
import { api } from '@/services/api'
import type { EvaluationProfile, ProfileCategory } from '@/types/profile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { PageTransition } from '@/components/PageTransition'
import { useToast } from '@/components/ui/Toast'
import { Shield, Plus, X, Trash2, Lock } from 'lucide-react'

const EXP_LABELS: Record<string, string> = { junior: 'Junior (0-2 yrs)', mid: 'Mid (3-5 yrs)', senior: 'Senior (5+ yrs)', lead: 'Lead/Principal' }
const ROLE_LABELS: Record<string, string> = { ic: 'Individual Contributor', tech_lead: 'Tech Lead', manager: 'Engineering Manager' }
const DOMAIN_LABELS: Record<string, string> = { frontend: 'Frontend', backend: 'Backend', fullstack: 'Fullstack', devops: 'DevOps', data: 'Data' }
const STRICT_LABELS: Record<string, string> = { lenient: 'Lenient', moderate: 'Moderate', strict: 'Strict' }

const STRICT_COLORS: Record<string, string> = { lenient: 'bg-emerald-50 text-emerald-700', moderate: 'bg-amber-50 text-amber-700', strict: 'bg-red-50 text-red-700' }

export function ProfilesPage() {
  const toast = useToast()
  const [profiles, setProfiles] = useState<EvaluationProfile[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [roleType, setRoleType] = useState('ic')
  const [domain, setDomain] = useState('fullstack')
  const [strictness, setStrictness] = useState('moderate')
  const [passThreshold, setPassThreshold] = useState('6.0')
  const [categories, setCategories] = useState<ProfileCategory[]>([
    { name: '', weight: 25, description: '' },
    { name: '', weight: 25, description: '' },
    { name: '', weight: 25, description: '' },
    { name: '', weight: 25, description: '' },
  ])

  const loadProfiles = () => {
    api.get<EvaluationProfile[]>('/profiles').then(setProfiles).catch(() => {})
  }

  useEffect(() => { loadProfiles() }, [])

  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0)

  const updateCategory = (index: number, field: keyof ProfileCategory, value: string | number) => {
    setCategories((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const addCategory = () => {
    if (categories.length >= 8) return
    const remaining = 100 - totalWeight
    setCategories([...categories, { name: '', weight: Math.max(remaining, 0), description: '' }])
  }

  const removeCategory = (index: number) => {
    if (categories.length <= 2) return
    setCategories((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setExperienceLevel('mid')
    setRoleType('ic')
    setDomain('fullstack')
    setStrictness('moderate')
    setPassThreshold('6.0')
    setCategories([
      { name: '', weight: 25, description: '' },
      { name: '', weight: 25, description: '' },
      { name: '', weight: 25, description: '' },
      { name: '', weight: 25, description: '' },
    ])
    setShowForm(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || categories.some((c) => !c.name)) {
      toast.error('Fill in all category names')
      return
    }
    if (totalWeight !== 100) {
      toast.error(`Weights must sum to 100 (currently ${totalWeight})`)
      return
    }

    setLoading(true)
    try {
      await api.post('/profiles', {
        name, description, experienceLevel, roleType, domain, categories, strictness,
        passThreshold: parseFloat(passThreshold),
      })
      toast.success('Profile created')
      resetForm()
      loadProfiles()
    } catch (err) {
      toast.error('Failed to create profile', err instanceof Error ? err.message : undefined)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return
    try {
      await api.delete(`/profiles/${id}`)
      toast.success('Profile deleted')
      loadProfiles()
    } catch {
      toast.error('Cannot delete preset profiles')
    }
  }

  const presets = profiles.filter((p) => p.is_preset)
  const custom = profiles.filter((p) => !p.is_preset)

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Evaluation Profiles</h1>
            <p className="mt-1 text-sm text-slate-500">Define how candidates are evaluated based on their experience level</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> New Profile</>}
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Evaluation Profile</CardTitle>
              <CardDescription>Define categories, weights, and scoring strictness</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input id="name" label="Profile Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mid-Level Frontend Dev" required />
                  <Input id="desc" label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When to use this profile" />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Select id="exp" label="Experience Level" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                    {Object.entries(EXP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <Select id="role" label="Role Type" value={roleType} onChange={(e) => setRoleType(e.target.value)}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <Select id="domain" label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)}>
                    {Object.entries(DOMAIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Select id="strict" label="Scoring Strictness" value={strictness} onChange={(e) => setStrictness(e.target.value)}>
                    <option value="lenient">Lenient — credit for potential</option>
                    <option value="moderate">Moderate — expect working knowledge</option>
                    <option value="strict">Strict — expect depth and precision</option>
                  </Select>
                  <Input id="threshold" label="Pass Threshold (out of 10)" type="number" min="1" max="10" step="0.5" value={passThreshold} onChange={(e) => setPassThreshold(e.target.value)} />
                </div>

                {/* Categories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-700">
                      Evaluation Categories
                      <span className={`ml-2 text-xs ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                        (Total: {totalWeight}% {totalWeight === 100 ? '' : '— must be 100%'})
                      </span>
                    </label>
                    {categories.length < 8 && (
                      <Button type="button" variant="ghost" size="sm" onClick={addCategory}>
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {categories.map((cat, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                            placeholder="Category name"
                            value={cat.name}
                            onChange={(e) => updateCategory(i, 'name', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="5"
                            max="50"
                            value={cat.weight}
                            onChange={(e) => updateCategory(i, 'weight', parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-center shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            placeholder="What to evaluate"
                            value={cat.description}
                            onChange={(e) => updateCategory(i, 'description', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        {categories.length > 2 && (
                          <button type="button" onClick={() => removeCategory(i)} className="mt-2 text-slate-400 hover:text-red-500 cursor-pointer">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || totalWeight !== 100}>
                  {loading ? 'Creating...' : 'Create Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Preset Profiles */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Built-in Presets</p>
          <div className="grid gap-4 md:grid-cols-2">
            {presets.map((p) => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </div>
        </div>

        {/* Custom Profiles */}
        {custom.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Custom Profiles</p>
            <div className="grid gap-4 md:grid-cols-2">
              {custom.map((p) => (
                <ProfileCard key={p.id} profile={p} onDelete={() => handleDelete(p.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

function ProfileCard({ profile: p, onDelete }: { profile: EvaluationProfile; onDelete?: () => void }) {
  const cats = typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{p.name}</p>
              {p.is_preset && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400"><Lock className="h-2.5 w-2.5" /> Preset</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STRICT_COLORS[p.strictness]}`}>
              {STRICT_LABELS[p.strictness]}
            </span>
            {onDelete && (
              <button onClick={onDelete} className="text-slate-400 hover:text-red-500 cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {p.description && <p className="mb-3 text-xs text-slate-500">{p.description}</p>}

        <div className="flex gap-3 mb-3 text-[10px]">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{EXP_LABELS[p.experience_level]}</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{ROLE_LABELS[p.role_type]}</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{DOMAIN_LABELS[p.domain]}</span>
        </div>

        <div className="space-y-1.5">
          {(cats as ProfileCategory[]).map((cat: ProfileCategory, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="h-1 flex-1 rounded-full bg-slate-100">
                <div className="h-1 rounded-full bg-indigo-400" style={{ width: `${cat.weight}%` }} />
              </div>
              <span className="w-8 text-right text-slate-400">{cat.weight}%</span>
              <span className="w-32 truncate text-slate-600">{cat.name}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-slate-400">Pass threshold: {p.pass_threshold}/10</p>
      </CardContent>
    </Card>
  )
}
