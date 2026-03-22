import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { candidateService } from '@/services/candidate'
import type { Interview } from '@/types/models'
import { CalendarDays, Clock, CheckCircle, Play, BookOpen } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' },
}

export function CandidateDashboard() {
  const user = useAuthStore((s) => s.user)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    candidateService.getInterviews({ page, limit })
      .then((res) => { setInterviews(res.data); setTotal(res.total) })
      .catch(() => {})
  }, [page])

  const upcoming = interviews.filter((i) => i.status === 'scheduled')
  const inProgress = interviews.filter((i) => i.status === 'in_progress')
  const completed = interviews.filter((i) => i.status === 'completed')

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <PageTransition>
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here are your scheduled interviews</p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{upcoming.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">In Progress</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{inProgress.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{completed.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-500">Your admin will schedule interviews for you</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Position</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Scheduled</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Duration</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {interviews.map((iv) => {
                    const sc = statusConfig[iv.status] || statusConfig.scheduled
                    return (
                      <tr key={iv.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 text-sm font-medium text-slate-900">
                          {iv.jd_title}
                          {iv.is_practice && (
                            <span className="ml-2 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-700">Practice</span>
                          )}
                        </td>
                        <td className="py-3.5 text-sm text-slate-500">
                          {new Date(iv.scheduled_start).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3.5 text-sm text-slate-500">{iv.duration_minutes} min</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            {iv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {iv.status === 'scheduled' && (
                            <Link to={`/candidate/prep/${iv.id}`}>
                              <Button variant="outline" size="sm">
                                <BookOpen className="h-3 w-3" /> Prepare
                              </Button>
                            </Link>
                          )}
                          {iv.status === 'in_progress' && (
                            <Link to={`/candidate/interview/${iv.id}`}>
                              <Button size="sm">
                                <Play className="h-3 w-3" /> Rejoin
                              </Button>
                            </Link>
                          )}
                          {iv.status === 'completed' && iv.candidate_feedback && (
                            <Link to={`/candidate/feedback/${iv.id}`}>
                              <Button variant="outline" size="sm">
                                <CheckCircle className="h-3 w-3" /> View Feedback
                              </Button>
                            </Link>
                          )}
                          {iv.status === 'completed' && !iv.candidate_feedback && (
                            <span className="text-xs text-slate-400">Completed</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  )
}
