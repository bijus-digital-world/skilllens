import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { api } from '@/services/api'
import type { Interview } from '@/types/models'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/PageTransition'
import { Radio, Eye, EyeOff } from 'lucide-react'

interface TranscriptEntry {
  role: string
  text: string
}

interface LiveInterview {
  id: string
  candidate_name: string
  jd_title: string
  transcript: TranscriptEntry[]
  active: boolean
}

export function LiveMonitorPage() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [inProgress, setInProgress] = useState<Interview[]>([])
  const [observing, setObserving] = useState<Map<string, LiveInterview>>(new Map())
  const transcriptRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Fetch in-progress interviews
  useEffect(() => {
    const load = () => {
      api.get<Interview[]>('/interviews')
        .then((interviews) => {
          setInProgress(interviews.filter((i) => i.status === 'in_progress'))
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  // Socket connection
  useEffect(() => {
    fetch('/api/auth/token', { credentials: 'include' })
      .then((res) => res.json())
      .then(({ token }) => {
        const socket = io(window.location.origin, {
          withCredentials: true,
          transports: ['websocket'],
          auth: { token },
        })
        socketRef.current = socket
        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))

        socket.on('live-transcript', (data: { interviewId: string; text: string; role: string }) => {
          setObserving((prev) => {
            const next = new Map(prev)
            const existing = next.get(data.interviewId)
            if (!existing) return next

            const transcript = [...existing.transcript]
            const last = transcript[transcript.length - 1]
            if (last && last.role === data.role) {
              transcript[transcript.length - 1] = { ...last, text: last.text + data.text }
            } else {
              transcript.push({ role: data.role, text: data.text })
            }

            next.set(data.interviewId, { ...existing, transcript })
            return next
          })

          // Auto-scroll
          setTimeout(() => {
            const ref = transcriptRefs.current.get(data.interviewId)
            if (ref) ref.scrollTop = ref.scrollHeight
          }, 50)
        })

        socket.on('live-ended', (data: { interviewId: string }) => {
          setObserving((prev) => {
            const next = new Map(prev)
            const existing = next.get(data.interviewId)
            if (existing) next.set(data.interviewId, { ...existing, active: false })
            return next
          })
        })
      })
      .catch(() => {})

    return () => { socketRef.current?.disconnect() }
  }, [])

  const startObserving = (interview: Interview) => {
    if (!socketRef.current) return
    socketRef.current.emit('observe-interview', { interviewId: interview.id })
    setObserving((prev) => {
      const next = new Map(prev)
      next.set(interview.id, {
        id: interview.id,
        candidate_name: interview.candidate_name,
        jd_title: interview.jd_title,
        transcript: [],
        active: true,
      })
      return next
    })
  }

  const stopObserving = (interviewId: string) => {
    if (!socketRef.current) return
    socketRef.current.emit('stop-observing', { interviewId })
    setObserving((prev) => {
      const next = new Map(prev)
      next.delete(interviewId)
      return next
    })
  }

  const observingIds = new Set(observing.keys())

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Monitoring</h1>
            <p className="mt-1 text-sm text-slate-500">Watch ongoing interviews in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-500">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* In-progress interviews */}
        {inProgress.length === 0 && observing.size === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Radio className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">No live interviews</p>
              <p className="mt-1 text-sm text-slate-500">Interviews will appear here when candidates start them</p>
            </CardContent>
          </Card>
        )}

        {inProgress.filter((i) => !observingIds.has(i.id)).length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Available to observe</p>
            <div className="grid gap-3">
              {inProgress.filter((i) => !observingIds.has(i.id)).map((iv) => (
                <Card key={iv.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{iv.candidate_name}</p>
                        <p className="text-xs text-slate-500">{iv.jd_title}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => startObserving(iv)}>
                      <Eye className="h-3.5 w-3.5" /> Observe
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Live feeds */}
        {observing.size > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live feeds</p>
            {Array.from(observing.values()).map((live) => (
              <Card key={live.id} className={live.active ? 'border-emerald-200' : 'border-slate-200 opacity-75'}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {live.active && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                      {!live.active && <div className="h-2 w-2 rounded-full bg-slate-400" />}
                      {live.candidate_name}
                      <span className="text-xs font-normal text-slate-400">{live.jd_title}</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => stopObserving(live.id)}>
                      <EyeOff className="h-3.5 w-3.5" /> Stop
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    ref={(el) => { if (el) transcriptRefs.current.set(live.id, el) }}
                    className="max-h-[300px] overflow-y-auto space-y-2 rounded-lg bg-slate-950 p-4"
                  >
                    {live.transcript.length === 0 && (
                      <p className="text-xs text-white/30 text-center py-8">Waiting for conversation...</p>
                    )}
                    {live.transcript.map((entry, i) => (
                      <div key={i} className={`text-sm ${entry.role === 'USER' ? 'text-blue-400' : 'text-slate-300'}`}>
                        <span className="text-[10px] uppercase tracking-wider opacity-50 mr-2">
                          {entry.role === 'USER' ? live.candidate_name.split(' ')[0] : 'AI'}
                        </span>
                        <span>{entry.text}</span>
                      </div>
                    ))}
                    {live.active && (
                      <div className="flex items-center gap-1.5 pt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-white/30">Live</span>
                      </div>
                    )}
                    {!live.active && (
                      <div className="pt-2 text-[10px] text-white/30 text-center">Interview ended</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
