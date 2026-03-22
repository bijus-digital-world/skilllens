import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { adminService } from '@/services/admin'
import type { Interview } from '@/types/models'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { Plus, XCircle, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function InterviewsPage() {
  const toast = useToast()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const load = async (p = page) => {
    try {
      const res = await adminService.getInterviews({ page: p, limit })
      setInterviews(res.data)
      setTotal(res.total)
    } catch {
      // ignore
    }
  }

  useEffect(() => { load() }, [page])

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this interview?')) return
    try {
      await adminService.cancelInterview(id)
      toast.success('Interview cancelled')
      await load()
    } catch {
      toast.error('Failed to cancel')
    }
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interviews</h1>
          <p className="text-muted-foreground">Manage all scheduled interviews</p>
        </div>
        <Link to="/admin/schedule">
          <Button><Plus className="mr-2 h-4 w-4" /> Schedule Interview</Button>
        </Link>
      </div>

      {interviews.length === 0 && total === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No interviews yet. Schedule one to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Candidate</th>
                    <th className="pb-3 font-medium text-muted-foreground">Position</th>
                    <th className="pb-3 font-medium text-muted-foreground">Scheduled</th>
                    <th className="pb-3 font-medium text-muted-foreground">Duration</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Score</th>
                    <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((iv) => (
                    <tr key={iv.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-foreground">{iv.candidate_name}</p>
                          <p className="text-xs text-muted-foreground">{iv.candidate_email}</p>
                        </div>
                      </td>
                      <td className="py-3">{iv.jd_title}</td>
                      <td className="py-3">
                        {new Date(iv.scheduled_start).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3">{iv.duration_minutes} min</td>
                      <td className="py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[iv.status]}`}>
                          {iv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3">{iv.overall_rating ?? '--'}</td>
                      <td className="py-3 space-x-1">
                        {iv.status === 'scheduled' && (
                          <Button variant="ghost" size="sm" onClick={() => handleCancel(iv.id)}>
                            <XCircle className="mr-1 h-4 w-4" /> Cancel
                          </Button>
                        )}
                        {iv.status === 'completed' && (
                          <Link to={`/admin/interviews/${iv.id}/results`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-1 h-4 w-4" /> Results
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
          </CardContent>
        </Card>
      )}
    </div>
    </PageTransition>
  )
}
