import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { useAudioCapture } from '@/hooks/useAudioCapture'
import { useAudioPlayback } from '@/hooks/useAudioPlayback'
import { useWebcamCapture } from '@/hooks/useWebcamCapture'
import { useProctoring } from '@/hooks/useProctoring'
import { Button } from '@/components/ui/Button'
import { AudioWaveform } from '@/components/ui/AudioWaveform'
import { PreflightCheck } from '@/components/PreflightCheck'
import { api } from '@/services/api'
import { Mic, MicOff, PhoneOff, Clock, Focus, CheckCircle } from 'lucide-react'

interface TranscriptEntry {
  role: 'USER' | 'ASSISTANT'
  text: string
  timestamp: Date
}

export function InterviewPage() {
  const { interviewId } = useParams<{ interviewId: string }>()
  const navigate = useNavigate()
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState<'connecting' | 'ready' | 'active' | 'reconnecting' | 'ended'>('connecting')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState('')
  const [micMuted, setMicMuted] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [jdTitle, setJdTitle] = useState('')
  const [persona, setPersona] = useState('')
  const [questionsCount, setQuestionsCount] = useState(0)
  const [evalDone, setEvalDone] = useState(false)
  const [evalError, setEvalError] = useState('')
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const aiSpeakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { playChunk, stop: stopPlayback } = useAudioPlayback()

  const handleAudioChunk = useCallback(
    (base64: string) => {
      if (!micMuted && socketRef.current) {
        socketRef.current.emit('audio-chunk', { audio: base64 })
      }
    },
    [micMuted]
  )

  const { isCapturing, start: startCapture, stop: stopCapture } = useAudioCapture(handleAudioChunk)

  // Proctoring: webcam snapshots
  const handleSnapshot = useCallback((image: string) => {
    if (socketRef.current) {
      socketRef.current.emit('snapshot', { image })
    }
  }, [])
  useWebcamCapture(handleSnapshot, 120000, status === 'active')

  // Proctoring: tab switches, fullscreen, devtools
  const handleProctoringEvent = useCallback((type: string, detail?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('proctoring-event', { type, detail })
    }
  }, [])
  const { requestFullscreen } = useProctoring(handleProctoringEvent, status === 'active')

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status])

  useEffect(() => {
    if (elapsedSeconds >= durationMinutes * 60 && status === 'active') {
      endInterview()
    }
  }, [elapsedSeconds, durationMinutes, status])

  // Warn before closing tab during active interview
  useEffect(() => {
    if (status !== 'active') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  // Fetch interview details for preflight
  useEffect(() => {
    if (!interviewId) return
    api.get<{ jd_title: string; duration_minutes: number }>(`/interviews/${interviewId}`)
      .then((data) => {
        setJdTitle(data.jd_title)
        setDurationMinutes(data.duration_minutes)
      })
      .catch(() => {})
  }, [interviewId])

  // Socket connection
  useEffect(() => {
    let socket: Socket

    fetch('/api/auth/token', { credentials: 'include' })
      .then((res) => res.json())
      .then(({ token }) => {
        socket = io(window.location.origin, {
          withCredentials: true,
          transports: ['websocket'],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
        })

        socketRef.current = socket

        socket.on('connect', () => {
          // If we were active before, this is a reconnection
          setStatus((prev) => {
            if (prev === 'reconnecting') {
              // Re-emit rejoin
              socket.emit('rejoin-interview', { interviewId })
              return 'reconnecting' // stay until server confirms
            }
            return 'ready'
          })
        })

        socket.on('disconnect', () => {
          setStatus((prev) => {
            if (prev === 'active') return 'reconnecting'
            return prev
          })
        })

        socket.io.on('reconnect_failed', () => {
          setError('Connection lost. Please refresh the page to try again.')
        })

        socket.on('interview-started', (data: { durationMinutes: number; persona?: string }) => {
          setDurationMinutes(data.durationMinutes)
          if (data.persona) setPersona(data.persona)
          setStatus('active')
        })

        socket.on('interview-rejoined', (data: { transcript: Array<{ role: string; text: string }> }) => {
          // Restore transcript from server
          if (data.transcript) {
            setTranscript(data.transcript.map((t) => ({
              role: t.role as 'USER' | 'ASSISTANT',
              text: t.text,
              timestamp: new Date(),
            })))
          }
          setStatus('active')
          // Resume audio capture
          startCapture().catch(() => {})
        })

        socket.on('audio-response', (data: { audio: string }) => {
          playChunk(data.audio)
          setAiSpeaking(true)
          if (aiSpeakingTimeoutRef.current) clearTimeout(aiSpeakingTimeoutRef.current)
          aiSpeakingTimeoutRef.current = setTimeout(() => setAiSpeaking(false), 500)
        })

        socket.on('transcript', (data: { text: string; role: 'USER' | 'ASSISTANT' }) => {
          setTranscript((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.role === data.role) {
              return [...prev.slice(0, -1), { ...last, text: last.text + data.text }]
            }
            return [...prev, { role: data.role, text: data.text, timestamp: new Date() }]
          })
        })

        socket.on('interview-complete', () => {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          stopCapture()
          stopPlayback()
          setStatus('ended')
        })
        socket.on('guardrail-action', (data: { action: string; reason: string }) => {
          if (data.action === 'end_interview') {
            stopCapture()
            stopPlayback()
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            socketRef.current?.emit('end-interview', { interviewId })
            setError(data.reason)
            setStatus('ended')
          }
        })
        socket.on('evaluation-complete', () => {
          setEvalDone(true)
        })
        socket.on('evaluation-error', (data: { message: string }) => {
          setEvalError(data.message)
        })
        socket.on('error', (data: { message: string }) => setError(data.message))
        socket.on('connect_error', (err: Error) => setError('Connection failed: ' + err.message))
      })
      .catch(() => setError('Failed to authenticate. Please login again.'))

    return () => { if (socket) socket.disconnect() }
  }, [playChunk])

  const handleStartInterview = async () => {
    if (!interviewId || !socketRef.current) return
    setError('')
    try {
      await startCapture()
      requestFullscreen()
      socketRef.current.emit('start-interview', { interviewId })
    } catch {
      setError('Could not access microphone. Please allow mic access and try again.')
    }
  }

  const confirmAndEndInterview = () => {
    if (!confirm('End the interview? Once ended, your responses will be evaluated and you cannot rejoin.')) return
    endInterview()
  }

  const endInterview = () => {
    stopCapture()
    stopPlayback()
    if (socketRef.current) socketRef.current.emit('end-interview', { interviewId })
    if (timerRef.current) clearInterval(timerRef.current)
    setStatus('ended')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const remainingSeconds = Math.max(0, durationMinutes * 60 - elapsedSeconds)
  const isTimeWarning = remainingSeconds < 120 && remainingSeconds > 0
  const progressPct = Math.min((elapsedSeconds / (durationMinutes * 60)) * 100, 100)

  // Full-screen immersive layout
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 overflow-hidden">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full bg-indigo-950/40 blur-[120px]" style={{ animation: 'ambient-drift 20s ease-in-out infinite' }} />
        <div className="absolute -bottom-1/3 -right-1/4 h-[600px] w-[600px] rounded-full bg-violet-950/30 blur-[100px]" style={{ animation: 'ambient-drift 25s ease-in-out infinite reverse' }} />
      </div>
      {/* Top Bar */}
      <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-3">
        {/* Progress bar */}
        {status === 'active' && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-indigo-500/30 w-full">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Focus className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-white/90">SkillLens Interview</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Persona badge */}
          {persona && status === 'active' && (
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              persona === 'friendly' ? 'bg-emerald-500/20 text-emerald-400' :
              persona === 'tough' ? 'bg-red-500/20 text-red-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {persona === 'rapid_fire' ? 'Rapid Fire' : persona}
            </span>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${status === 'active' ? 'animate-pulse bg-emerald-400' : status === 'ended' ? 'bg-slate-500' : 'bg-amber-400'}`} />
            <span className="text-xs font-medium text-white/60">
              {status === 'connecting' && 'Connecting...'}
              {status === 'ready' && 'Ready'}
              {status === 'active' && 'Live'}
              {status === 'ended' && 'Ended'}
            </span>
          </div>

          {/* Timer */}
          {status === 'active' && (
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-semibold ${isTimeWarning ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/80'}`}>
              <Clock className="h-3 w-3" />
              {formatTime(remainingSeconds)}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className={`flex flex-1 flex-col items-center overflow-hidden ${status === 'ready' ? 'overflow-y-auto py-6' : 'justify-center'}`}>
        {/* Pre-flight Check Room */}
        {status === 'ready' && (
          <PreflightCheck
            durationMinutes={durationMinutes}
            jdTitle={jdTitle || 'Technical Interview'}
            onReady={handleStartInterview}
          />
        )}

        {/* Active Interview */}
        {status === 'active' && (
          <div className="flex h-full w-full max-w-3xl flex-col px-6 py-4">
            {/* AI Status Indicator */}
            <div className="mb-4 flex items-center justify-center gap-3">
              <AudioWaveform active={aiSpeaking} variant="speaking" />
              <span className="text-xs font-medium text-white/40">
                {aiSpeaking ? 'Interviewer is speaking...' : 'Listening to you...'}
              </span>
              <AudioWaveform active={!aiSpeaking && isCapturing && !micMuted} variant="listening" />
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {transcript.length === 0 && (
                <p className="py-20 text-center text-sm text-white/30 animate-pulse">
                  Waiting for the interviewer to start speaking...
                </p>
              )}
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`flex ${entry.role === 'USER' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      entry.role === 'USER'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/10 text-white/90'
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-50">
                      {entry.role === 'USER' ? 'You' : 'Interviewer'}
                    </p>
                    <p className="whitespace-pre-wrap">{entry.text}</p>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {/* Post-Interview Debrief */}
        {status === 'ended' && (
          <div className="w-full max-w-md animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-6 mb-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Interview Complete</h2>
                <p className="mt-2 text-sm text-white/50">Here's a quick summary</p>
              </div>
            </div>

            {/* Debrief Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Duration</span>
                <span className="font-medium text-white">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Position</span>
                <span className="font-medium text-white">{jdTitle || 'Technical Interview'}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Exchanges</span>
                <span className="font-medium text-white">{transcript.length}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Evaluation</span>
                {evalDone ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Complete
                  </span>
                ) : evalError ? (
                  <span className="text-red-400 text-xs font-medium">Failed</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Processing...
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={() => navigate('/candidate')}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Reconnecting */}
        {status === 'reconnecting' && (
          <div className="flex h-full w-full max-w-3xl flex-col px-6 py-4">
            {/* Show existing transcript underneath */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 opacity-50">
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`flex ${entry.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      entry.role === 'USER' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/90'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Reconnecting overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60">
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-500/30 bg-slate-900 px-8 py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                <p className="text-sm font-medium text-amber-400">Reconnecting...</p>
                <p className="text-xs text-white/40">Your interview is still active</p>
              </div>
            </div>
          </div>
        )}

        {/* Connecting */}
        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-white/50">Connecting to interview server...</p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {status === 'active' && (
        <div className="flex items-center justify-center gap-4 border-t border-white/10 py-5">
          <button
            onClick={() => setMicMuted(!micMuted)}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all cursor-pointer ${
              micMuted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={confirmAndEndInterview}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition-all hover:bg-red-700 hover:scale-105 cursor-pointer"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
