import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import { adminService } from '@/services/admin'
import type { JobDescription } from '@/types/models'
import type { EvaluationResult } from '@/types/evaluation'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { RadarChart } from '@/components/ui/RadarChart'
import { PageTransition } from '@/components/PageTransition'
import { Eye, Users } from 'lucide-react'

interface CompareCandidate {
  id: string
  overall_rating: number
  score: EvaluationResult | string
  scheduled_start: string
  candidate_name: string
  candidate_email: string
}

const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#a855f7']

export function ComparePage() {
  const [jds, setJds] = useState<JobDescription[]>([])
  const [selectedJd, setSelectedJd] = useState('')
  const [candidates, setCandidates] = useState<CompareCandidate[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    adminService.getJobDescriptions({ limit: 100 }).then((res) => setJds(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedJd) { setCandidates([]); return }
    setLoading(true)
    api.get<CompareCandidate[]>(`/interviews/compare/${selectedJd}`)
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedJd])

  const parsedCandidates = candidates.map((c) => ({
    ...c,
    evaluation: (typeof c.score === 'string' ? JSON.parse(c.score) : c.score) as EvaluationResult,
  }))

  const categoryLabels = parsedCandidates.length > 0
    ? parsedCandidates[0].evaluation.categories.map((c) => c.name)
    : []

  const radarDatasets = parsedCandidates.map((c, i) => ({
    label: c.candidate_name,
    values: c.evaluation.categories.map((cat) => cat.score),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Compare Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">Side-by-side comparison of evaluated candidates for a position</p>
        </div>

        <Select
          id="jd-select"
          label="Select a position"
          value={selectedJd}
          onChange={(e) => setSelectedJd(e.target.value)}
        >
          <option value="">Choose a job description</option>
          {jds.map((jd) => (
            <option key={jd.id} value={jd.id}>{jd.title}</option>
          ))}
        </Select>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && selectedJd && parsedCandidates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">No evaluated candidates yet</p>
              <p className="mt-1 text-sm text-slate-500">Complete some interviews for this position first</p>
            </CardContent>
          </Card>
        )}

        {parsedCandidates.length > 0 && (
          <>
            {/* Radar Chart */}
            {parsedCandidates.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-center">
                    <RadarChart
                      labels={categoryLabels}
                      datasets={radarDatasets}
                      maxValue={10}
                      size={320}
                    />
                    {/* Legend */}
                    <div className="space-y-2">
                      {parsedCandidates.map((c, i) => (
                        <div key={c.id} className="flex items-center gap-2.5">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-sm text-slate-700">{c.candidate_name}</span>
                          <span className="text-xs text-slate-400">({c.evaluation.overallRating}/10)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Candidate Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {parsedCandidates.map((c, i) => (
                <Card
                  key={c.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDuration: '400ms', animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      >
                        {c.candidate_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="font-semibold text-slate-900">{c.candidate_name}</p>
                      <p className="text-xs text-slate-400">{c.candidate_email}</p>

                      <div className="my-4">
                        <ScoreRing score={c.evaluation.overallRating} maxScore={10} size={100} strokeWidth={7} delay={300 + i * 150} />
                      </div>

                      <p className={`text-sm font-semibold ${
                        c.evaluation.recommendation.includes('Strong') ? 'text-emerald-600' :
                        c.evaluation.recommendation.includes('No') ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {c.evaluation.recommendation}
                      </p>

                      {/* Category mini-bars */}
                      <div className="mt-4 w-full space-y-2">
                        {c.evaluation.categories.map((cat, ci) => (
                          <div key={ci} className="flex items-center gap-2 text-xs">
                            <span className="w-24 text-right text-slate-400 truncate">{cat.name}</span>
                            <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                              <div
                                className={`h-1.5 rounded-full ${cat.score >= 7 ? 'bg-emerald-400' : cat.score >= 5 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${(cat.score / cat.maxScore) * 100}%`, transition: 'width 1s ease-out' }}
                              />
                            </div>
                            <span className="w-6 text-slate-500">{cat.score}</span>
                          </div>
                        ))}
                      </div>

                      <Link to={`/admin/interviews/${c.id}/results`} className="mt-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3.5 w-3.5" /> Full Report
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
