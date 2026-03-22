import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import type { InterviewDetail } from '@/types/evaluation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft, Download, CheckCircle, AlertTriangle } from 'lucide-react'

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100
  const color = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div
        className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function ResultsPage() {
  const { interviewId } = useParams<{ interviewId: string }>()
  const [interview, setInterview] = useState<InterviewDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!interviewId) return
    api.get<InterviewDetail>(`/interviews/${interviewId}`)
      .then(setInterview)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [interviewId])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!interview) return <p className="text-slate-500">Interview not found.</p>

  const evaluation = interview.score

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/candidate">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Your Results</h1>
            <p className="text-sm text-slate-500">{interview.jd_title}</p>
          </div>
        </div>

        {!evaluation ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              {interview.status === 'completed'
                ? 'Your evaluation is being generated. Check back shortly.'
                : `Interview status: ${interview.status}`}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 p-8">
                <div className="flex flex-col items-center gap-4">
                  <ScoreRing score={evaluation.overallRating} maxScore={10} size={160} strokeWidth={12} />
                  <div className="text-center">
                    <p className={`text-lg font-bold ${
                      evaluation.recommendation.includes('Strong') ? 'text-emerald-600' :
                      evaluation.recommendation.includes('No') ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {evaluation.recommendation}
                    </p>
                    <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
                      {evaluation.overallComments}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/interviews/${interviewId}/report`, '_blank')}
                  >
                    <Download className="h-4 w-4" /> Download PDF Report
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How you scored</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {evaluation.categories.map((cat, i) => (
                    <div
                      key={i}
                      className="animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDuration: '400ms', animationDelay: `${300 + i * 100}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                        <span className={`text-sm font-bold ${cat.score >= 7 ? 'text-emerald-600' : cat.score >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                          {cat.score}/{cat.maxScore}
                        </span>
                      </div>
                      <ScoreBar score={cat.score} maxScore={cat.maxScore} />
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{cat.comments}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle className="h-5 w-5" /> What went well
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" /> Where to improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {evaluation.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">!</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
