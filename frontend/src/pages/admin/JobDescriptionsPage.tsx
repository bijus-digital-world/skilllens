import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { adminService } from '@/services/admin'
import type { JobDescription } from '@/types/models'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Upload, Trash2, FileText, Plus, X, Eye, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Pagination } from '@/components/ui/Pagination'

export function JobDescriptionsPage() {
  const toast = useToast()
  const [jds, setJds] = useState<JobDescription[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadJds = async (p = page) => {
    try {
      const res = await adminService.getJobDescriptions({ page: p, limit })
      setJds(res.data)
      setTotal(res.total)
    } catch {
      // ignore
    }
  }

  useEffect(() => { loadJds() }, [page])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title) { setError('Title is required'); return }
    if (!file && !description) { setError('Upload a file or enter a description'); return }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('title', title)
      if (description) formData.append('description', description)
      if (file) formData.append('file', file)
      await adminService.createJobDescription(formData)
      setTitle('')
      setDescription('')
      setFile(null)
      setShowForm(false)
      toast.success('Job description created')
      await loadJds()
    } catch (err) {
      toast.error('Failed to create JD', err instanceof Error ? err.message : undefined)
      setError(err instanceof Error ? err.message : 'Failed to create JD')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job description?')) return
    try {
      await adminService.deleteJobDescription(id)
      toast.success('Job description deleted')
      await loadJds()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Descriptions</h1>
          <p className="text-muted-foreground">Upload and manage job descriptions for interviews</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add JD</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <Input id="title" label="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior React Developer" required />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Description (optional if uploading file)</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste job description text here..."
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Or upload file (PDF, DOCX, TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                />
              </div>
              <Button type="submit" disabled={loading}>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? 'Uploading...' : 'Create Job Description'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {jds.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No job descriptions yet. Click "Add JD" to create one.
            </CardContent>
          </Card>
        ) : (
          jds.map((jd) => (
            <Card key={jd.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{jd.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {jd.file_name || 'Text only'} &middot; {new Date(jd.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(jd as Record<string, unknown>).has_analysis && (
                    <span className="mr-2 flex items-center gap-1 text-[10px] text-indigo-500 font-medium">
                      <Sparkles className="h-3 w-3" /> Analyzed
                    </span>
                  )}
                  <Link to={`/admin/job-descriptions/${jd.id}`}>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(jd.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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
