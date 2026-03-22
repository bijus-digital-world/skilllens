import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft, CheckCircle, MessageCircle, Code, Lightbulb } from 'lucide-react'

interface InterviewFeedback {
  jd_title: string
  scheduled_start: string
  duration_minutes: number
  is_practice: boolean
  candidate_feedback: {
    summary: string
    communicationTips: string[]
    technicalTips: string[]
    whatWentWell: string[]
  } | null
}

export function FeedbackPage() {
  const { interviewId } = useParams<{ interviewId: string }>()
  const [data, setData] = useState<InterviewFeedback | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!interviewId) return
    api.get<InterviewFeedback>(`/interviews/${interviewId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [interviewId])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!data?.candidate_feedback) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-slate-500">Feedback is not available yet. Please check back later.</p>
        <Link to="/candidate" className="mt-4 inline-block">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const feedback = data.candidate_feedback
  const date = new Date(data.scheduled_start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/candidate">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Interview Feedback</h1>
            <p className="text-sm text-slate-500">
              {data.jd_title} &middot; {date}
              {data.is_practice && (
                <span className="ml-2 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-700">Practice</span>
              )}
            </p>
          </div>
        </div>

        {/* Summary */}
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="p-6">
            <p className="text-sm text-slate-700 leading-relaxed">{feedback.summary}</p>
          </CardContent>
        </Card>

        {/* What Went Well */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700 text-base">
              <CheckCircle className="h-5 w-5" /> What Went Well
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {feedback.whatWentWell.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Communication Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
              <MessageCircle className="h-5 w-5" /> Communication Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {feedback.communicationTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                    <Lightbulb className="h-3 w-3" />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Technical Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 text-base">
              <Code className="h-5 w-5" /> Technical Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {feedback.technicalTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                    <Lightbulb className="h-3 w-3" />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          This feedback is designed to help you improve. Scores and detailed evaluations are not shared with candidates.
        </p>
      </div>
    </PageTransition>
  )
}
