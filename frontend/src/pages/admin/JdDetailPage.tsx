import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  ArrowLeft, Sparkles, AlertTriangle, Target, Clock, User,
  CheckCircle, Circle, RefreshCw,
} from 'lucide-react'

interface JdAnalysis {
  skills: Array<{ name: string; importance: 'must_have' | 'nice_to_have'; category: string }>
  experienceLevel: { detected: string; years: string; confidence: string }
  suggestedProfile: string
  suggestedDuration: number
  roleSummary: string
  flags: string[]
  interviewFocus: string[]
}

interface JdDetail {
  id: string
  title: string
  description: string | null
  file_name: string | null
  extracted_text: string | null
  analysis: JdAnalysis | null
  created_at: string
}

const PROFILE_LABELS: Record<string, string> = {
  junior: 'Junior Developer', mid: 'Mid-Level Developer', senior: 'Senior Developer', lead: 'Tech Lead',
}

const CATEGORY_COLORS: Record<string, string> = {
  Frontend: 'bg-blue-100 text-blue-700',
  Backend: 'bg-green-100 text-green-700',
  Database: 'bg-purple-100 text-purple-700',
  Cloud: 'bg-sky-100 text-sky-700',
  DevOps: 'bg-orange-100 text-orange-700',
  Testing: 'bg-teal-100 text-teal-700',
  Architecture: 'bg-indigo-100 text-indigo-700',
  'Soft Skills': 'bg-pink-100 text-pink-700',
  Other: 'bg-slate-100 text-slate-600',
}

export function JdDetailPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const [jd, setJd] = useState<JdDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  const loadJd = () => {
    if (!id) return
    api.get<JdDetail>(`/job-descriptions/${id}`)
      .then(setJd)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadJd() }, [id])

  const handleAnalyze = async () => {
    if (!id) return
    setAnalyzing(true)
    try {
      const analysis = await api.post<JdAnalysis>(`/job-descriptions/${id}/analyze`, {})
      setJd((prev) => prev ? { ...prev, analysis } : prev)
      toast.success('Analysis complete')
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!jd) return <p className="text-slate-500">Job description not found.</p>

  const analysis = jd.analysis
    ? (typeof jd.analysis === 'string' ? JSON.parse(jd.analysis) : jd.analysis) as JdAnalysis
    : null

  const mustHave = analysis?.skills.filter((s) => s.importance === 'must_have') || []
  const niceToHave = analysis?.skills.filter((s) => s.importance === 'nice_to_have') || []

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/job-descriptions">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{jd.title}</h1>
              <p className="text-sm text-slate-500">
                {jd.file_name || 'Text entry'} &middot; {new Date(jd.created_at).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing...</>
            ) : analysis ? (
              <><RefreshCw className="h-4 w-4" /> Re-analyze</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Analyze with AI</>
            )}
          </Button>
        </div>

        {/* Analysis Results */}
        {analysis ? (
          <>
            {/* Summary Row */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Level</p>
                      <p className="text-sm font-semibold text-slate-900">{analysis.experienceLevel.detected}</p>
                      <p className="text-[10px] text-slate-400">{analysis.experienceLevel.years}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Profile</p>
                      <p className="text-sm font-semibold text-slate-900">{PROFILE_LABELS[analysis.suggestedProfile] || analysis.suggestedProfile}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Duration</p>
                      <p className="text-sm font-semibold text-slate-900">{analysis.suggestedDuration} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Skills Found</p>
                      <p className="text-sm font-semibold text-slate-900">{analysis.skills.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Role Summary */}
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-700 leading-relaxed">{analysis.roleSummary}</p>
              </CardContent>
            </Card>

            {/* Skills */}
            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Must-Have Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {mustHave.map((s, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.Other}`}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nice-to-Have</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {niceToHave.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {s.name}
                      </span>
                    ))}
                    {niceToHave.length === 0 && <p className="text-xs text-slate-400">None identified</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Interview Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.interviewFocus.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Target className="h-4 w-4 mt-0.5 text-indigo-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Flags */}
            {analysis.flags.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 text-base">
                    <AlertTriangle className="h-4 w-4" /> Observations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.flags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-amber-800">
                        <Circle className="h-1.5 w-1.5 mt-2 fill-amber-500 text-amber-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                <Sparkles className="h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">AI analysis available</p>
              <p className="mt-1 text-sm text-slate-500">Click "Analyze with AI" to extract skills, detect experience level, and get interview recommendations</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
