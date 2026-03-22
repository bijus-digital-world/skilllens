import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import {
  CalendarDays,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Eye,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { PageTransition } from '@/components/PageTransition'

interface DashboardStats {
  interviews: {
    scheduled: number
    inProgress: number
    completed: number
    cancelled: number
    total: number
  }
  candidates: number
  averageScore: number | null
  insights: string[]
  recentInterviews: Array<{
    id: string
    status: string
    scheduled_start: string
    overall_rating: number | null
    duration_minutes: number
    candidate_name: string
    candidate_email: string
    jd_title: string
  }>
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' },
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening with your interviews
          </p>
        </div>
        <Link to="/admin/schedule">
          <Button>
            <Plus className="h-4 w-4" /> Schedule Interview
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Scheduled"
          value={stats?.interviews.scheduled ?? 0}
          subtitle="Upcoming interviews"
          icon={CalendarDays}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Candidates"
          value={stats?.candidates ?? 0}
          subtitle="Registered candidates"
          icon={Users}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          title="Completed"
          value={stats?.interviews.completed ?? 0}
          subtitle="Finished interviews"
          icon={FileText}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Avg Score"
          value={stats?.averageScore != null ? `${stats.averageScore}` : '--'}
          subtitle="Out of 10"
          icon={TrendingUp}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Insights */}
      {stats && stats.insights.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="space-y-1">
            {stats.insights.map((insight, i) => (
              <p key={i} className="text-sm text-indigo-900">{insight}</p>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Alert */}
      {stats && stats.interviews.inProgress > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-800">
            {stats.interviews.inProgress} interview{stats.interviews.inProgress > 1 ? 's' : ''} currently in progress
          </p>
        </div>
      )}

      {/* Recent Interviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Interviews</CardTitle>
          <Link to="/admin/interviews">
            <Button variant="ghost" size="sm" className="text-slate-500">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!stats || stats.recentInterviews.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-500">Get started by uploading a JD and scheduling an interview</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Candidate</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Position</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Date</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Score</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentInterviews.map((iv) => {
                    const sc = statusConfig[iv.status] || statusConfig.scheduled
                    return (
                      <tr key={iv.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5">
                          <p className="text-sm font-medium text-slate-900">{iv.candidate_name}</p>
                          <p className="text-xs text-slate-400">{iv.candidate_email}</p>
                        </td>
                        <td className="py-3.5 text-sm text-slate-600">{iv.jd_title}</td>
                        <td className="py-3.5 text-sm text-slate-500">
                          {new Date(iv.scheduled_start).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            {iv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-sm font-semibold text-slate-900">{iv.overall_rating ?? '--'}</td>
                        <td className="py-3.5 text-right">
                          {iv.status === 'completed' && (
                            <Link to={`/admin/interviews/${iv.id}/results`}>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-3.5 w-3.5" /> View
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  )
}
