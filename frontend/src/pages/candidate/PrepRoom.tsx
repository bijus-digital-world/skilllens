import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ArrowLeft, Calendar, Clock, Mic, CheckCircle, BookOpen,
  ChevronRight, Play,
} from 'lucide-react'

interface InterviewPrep {
  id: string
  jd_title: string
  duration_minutes: number
  scheduled_start: string
  status: string
}

export function PrepRoom() {
  const { interviewId } = useParams<{ interviewId: string }>()
  const [interview, setInterview] = useState<InterviewPrep | null>(null)
  const [loading, setLoading] = useState(true)
  const [micTested, setMicTested] = useState(false)
  const [micWorking, setMicWorking] = useState(false)

  useEffect(() => {
    if (!interviewId) return
    api.get<InterviewPrep>(`/interviews/${interviewId}`)
      .then(setInterview)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [interviewId])

  const testMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setMicWorking(true)
      setMicTested(true)
    } catch {
      setMicWorking(false)
      setMicTested(true)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!interview) return <p className="text-slate-500">Interview not found.</p>

  const scheduledDate = new Date(interview.scheduled_start)
  const now = new Date()
  const hoursUntil = Math.max(0, (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  const canJoin = interview.status === 'scheduled' || interview.status === 'in_progress'

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/candidate">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Interview Preparation</h1>
            <p className="text-sm text-slate-500">{interview.jd_title}</p>
          </div>
        </div>

        {/* Interview Details */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Scheduled</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {scheduledDate.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {scheduledDate.toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Duration</p>
                  <p className="text-sm font-semibold text-slate-900">{interview.duration_minutes} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Format</p>
                  <p className="text-sm font-semibold text-slate-900">Voice Interview</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mic Check */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Microphone</p>
                  <p className="text-xs text-slate-500">
                    {!micTested ? 'Test your mic before the interview' :
                      micWorking ? 'Working correctly' : 'Not detected — check browser permissions'}
                  </p>
                </div>
              </div>
              {!micTested ? (
                <Button variant="outline" size="sm" onClick={testMic}>Test Mic</Button>
              ) : (
                <span className={`flex items-center gap-1 text-xs font-medium ${micWorking ? 'text-emerald-600' : 'text-red-500'}`}>
                  {micWorking ? <><CheckCircle className="h-3.5 w-3.5" /> Pass</> : 'Failed'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preparation Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" /> How to prepare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                'Review the job description carefully — understand what skills and experience they are looking for',
                'Prepare 2-3 specific examples from your past work that demonstrate relevant experience',
                'Think about projects where you faced technical challenges and how you solved them',
                'Be ready to explain your decisions — why you chose a certain approach over alternatives',
                'It\'s okay to take a moment to think before answering. Silence is better than rushing.',
                'If you don\'t understand a question, ask the interviewer to clarify or rephrase',
                'Speak clearly and at a comfortable pace. The AI is listening and will wait for you.',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-indigo-400 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What to Expect */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What to expect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-slate-600">
              <p>The interview will be conducted by an AI interviewer who will ask you technical questions based on the job description.</p>
              <p>The interviewer will start with a greeting, then ask 5-8 questions. Questions may adapt based on your answers — this is to find your strengths, not to trick you.</p>
              <p>You can end the interview at any time by clicking the end button. Your responses will be evaluated after the interview.</p>
            </div>
          </CardContent>
        </Card>

        {/* Join Button */}
        {canJoin && (
          <Link to={`/candidate/interview/${interviewId}`}>
            <Button size="lg" className="w-full">
              <Play className="h-4 w-4" />
              {hoursUntil > 0 ? `Join Interview (in ${Math.ceil(hoursUntil)}h)` : 'Join Interview Now'}
            </Button>
          </Link>
        )}
      </div>
    </PageTransition>
  )
}
