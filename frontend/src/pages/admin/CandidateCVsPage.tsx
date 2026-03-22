import { type FormEvent, useEffect, useState } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { adminService } from '@/services/admin'
import type { CandidateCV, Candidate } from '@/types/models'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Upload, Trash2, FileText, Plus, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Pagination } from '@/components/ui/Pagination'

export function CandidateCVsPage() {
  const toast = useToast()
  const [cvs, setCvs] = useState<CandidateCV[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20
  const [showForm, setShowForm] = useState(false)
  const [candidateId, setCandidateId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = async (p = page) => {
    try {
      const [cvsRes, candidatesData] = await Promise.all([
        adminService.getCVs({ page: p, limit }),
        adminService.getCandidates(),
      ])
      setCvs(cvsRes.data)
      setTotal(cvsRes.total)
      setCandidates(candidatesData)
    } catch {
      // ignore
    }
  }

  useEffect(() => { loadData() }, [page])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!candidateId) { setError('Select a candidate'); return }
    if (!file) { setError('Select a file'); return }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('candidateId', candidateId)
      formData.append('file', file)
      await adminService.uploadCV(formData)
      setCandidateId('')
      setFile(null)
      setShowForm(false)
      toast.success('CV uploaded')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CV')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this CV?')) return
    try {
      await adminService.deleteCV(id)
      toast.success('CV deleted')
      await loadData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidate CVs</h1>
          <p className="text-muted-foreground">Upload CVs for registered candidates</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Upload CV</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CV</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              {candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No candidates registered yet. Ask candidates to sign up first.</p>
              ) : (
                <>
                  <Select id="candidate" label="Candidate" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} required>
                    <option value="">Select a candidate</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </Select>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">CV File (PDF, DOCX, TXT)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {loading ? 'Uploading...' : 'Upload CV'}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {cvs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No CVs uploaded yet.
            </CardContent>
          </Card>
        ) : (
          cvs.map((cv) => (
            <Card key={cv.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{cv.candidate_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cv.file_name} &middot; {cv.candidate_email} &middot; {new Date(cv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cv.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>
    </div>
    </PageTransition>
  )
}
