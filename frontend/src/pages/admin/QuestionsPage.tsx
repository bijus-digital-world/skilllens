import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { api } from '@/services/api'
import { adminService } from '@/services/admin'
import type { JobDescription, CandidateCV } from '@/types/models'
import type { QuestionSet } from '@/types/questions'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Sparkles, Trash2, Eye, FileQuestion } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const difficultyColors: Record<string, string> = {
  simple: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  tough: 'bg-red-100 text-red-800',
}

export function QuestionsPage() {
  const [jds, setJds] = useState<JobDescription[]>([])
  const [cvs, setCvs] = useState<CandidateCV[]>([])
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])

  const toast = useToast()
  const [jdId, setJdId] = useState('')
  const [cvId, setCvId] = useState('')
  const [difficulty, setDifficulty] = useState('moderate')
  const [count, setCount] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      const [j, c, q] = await Promise.all([
        adminService.getJobDescriptions({ limit: 100 }),
        adminService.getCVs({ limit: 100 }),
        api.get<QuestionSet[]>('/questions'),
      ])
      setJds(j.data)
      setCvs(c.data)
      setQuestionSets(q)
    } catch {
      // ignore
    }
  }

  useEffect(() => { loadData() }, [])

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    if (!jdId) { setError('Select a job description'); return }

    setLoading(true)
    setError('')
    try {
      await api.post('/questions/generate', {
        jdId,
        cvId: cvId || undefined,
        difficulty,
        count: parseInt(count, 10),
      })
      toast.success('Questions generated')
      await loadData()
    } catch (err) {
      toast.error('Generation failed', err instanceof Error ? err.message : undefined)
      setError(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question set?')) return
    try {
      await api.delete(`/questions/${id}`)
      toast.success('Question set deleted')
      await loadData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Question Generator</h1>
        <p className="text-muted-foreground">Generate interview questions based on JD and candidate CV</p>
      </div>

      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Generate Questions
          </CardTitle>
          <CardDescription>AI will create technical interview questions tailored to the role and candidate</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <Select id="jd" label="Job Description" value={jdId} onChange={(e) => setJdId(e.target.value)} required>
              <option value="">Select a job description</option>
              {jds.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </Select>

            <Select id="cv" label="Candidate CV (optional)" value={cvId} onChange={(e) => setCvId(e.target.value)}>
              <option value="">No specific candidate (general questions)</option>
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id}>{cv.candidate_name} - {cv.file_name}</option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Select id="difficulty" label="Difficulty Level" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="simple">Simple - Fundamentals & basics</option>
                <option value="moderate">Moderate - Applied knowledge</option>
                <option value="tough">Tough - Expert-level & system design</option>
              </Select>

              <Input
                id="count"
                label="Number of Questions"
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? 'Generating questions...' : 'Generate Questions'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Saved Question Sets */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Saved Question Sets</h2>
        {questionSets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No question sets generated yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {questionSets.map((qs) => (
              <Card key={qs.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <FileQuestion className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{qs.jd_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {qs.candidate_name ? `For: ${qs.candidate_name}` : 'General'} &middot;{' '}
                        {qs.question_count} questions &middot;{' '}
                        {new Date(qs.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[qs.difficulty]}`}>
                      {qs.difficulty}
                    </span>
                    <Link to={`/admin/questions/${qs.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="mr-1 h-4 w-4" /> View</Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(qs.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  )
}
