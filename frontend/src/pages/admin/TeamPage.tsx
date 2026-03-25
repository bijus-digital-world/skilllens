import { type FormEvent, useEffect, useState } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/services/api'
import { Plus, X, UserPlus, Shield, User, Copy, Check } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  name: string
  role: 'admin' | 'candidate'
  is_self_registered: boolean
  must_change_password: boolean
  created_at: string
}

export function TeamPage() {
  const toast = useToast()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const loadMembers = async () => {
    try {
      const data = await api.get<TeamMember[]>('/team')
      setMembers(data)
    } catch {
      // ignore
    }
  }

  useEffect(() => { loadMembers() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email) { setError('Name and email required'); return }

    setLoading(true)
    setError('')
    setTempPassword('')
    try {
      const res = await api.post<TeamMember & { tempPassword: string }>('/team', { name, email, role })
      setTempPassword(res.tempPassword)
      toast.success(`${role === 'admin' ? 'Admin' : 'Candidate'} account created`)
      setName('')
      setEmail('')
      await loadMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const admins = members.filter(m => m.role === 'admin')
  const candidates = members.filter(m => m.role === 'candidate' && !m.is_self_registered)
  const selfRegistered = members.filter(m => m.role === 'candidate' && m.is_self_registered)

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team</h1>
            <p className="text-muted-foreground">Manage admins and candidate accounts</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setTempPassword('') }}>
            {showForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add User</>}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Create User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
                <Input id="name" label="Full name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input id="email" label="Email address" type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Select id="role" label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="admin">Admin — can schedule interviews and view results</option>
                  <option value="candidate">Candidate — can attend scheduled interviews</option>
                </Select>
                <Button type="submit" disabled={loading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </form>

              {tempPassword && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">Account created! Temporary credentials:</p>
                  <div className="mt-2 flex items-center gap-3">
                    <code className="rounded bg-white px-3 py-1.5 text-sm font-mono text-emerald-900 border border-emerald-200">
                      {tempPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-emerald-600">An email with these credentials has been sent. User must change password on first login.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-indigo-600" /> Admins ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin users</p>
            ) : (
              <div className="space-y-2">
                {admins.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.must_change_password && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending setup</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin-Created Candidates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-emerald-600" /> Candidates ({candidates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No candidate accounts created yet. Candidates are auto-created when you schedule interviews.</p>
            ) : (
              <div className="space-y-2">
                {candidates.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.must_change_password && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending login</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-Registered */}
        {selfRegistered.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-slate-400" /> Self-Registered ({selfRegistered.length})
                <span className="text-xs font-normal text-muted-foreground">— practice mode only</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selfRegistered.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Practice only</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
