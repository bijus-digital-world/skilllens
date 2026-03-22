import { useEffect, useRef, useState } from 'react'
import { Mic, Wifi, Clock, FileText, Check, AlertCircle, ChevronRight, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PreflightCheckProps {
  durationMinutes: number
  jdTitle: string
  onReady: () => void
}

type CheckStatus = 'pending' | 'checking' | 'pass' | 'fail'

export function PreflightCheck({ durationMinutes, jdTitle, onReady }: PreflightCheckProps) {
  const [micStatus, setMicStatus] = useState<CheckStatus>('pending')
  const [cameraStatus, setCameraStatus] = useState<CheckStatus>('pending')
  const [connectionStatus, setConnectionStatus] = useState<CheckStatus>('pending')
  const [micLevel, setMicLevel] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  // Run connection check
  useEffect(() => {
    setConnectionStatus('checking')
    const start = Date.now()
    fetch('/api/health')
      .then(() => {
        const latency = Date.now() - start
        // Small delay so user sees the checking state
        setTimeout(() => setConnectionStatus(latency < 2000 ? 'pass' : 'fail'), 600)
      })
      .catch(() => setTimeout(() => setConnectionStatus('fail'), 600))
  }, [])

  // Run mic check
  useEffect(() => {
    let cancelled = false
    setMicStatus('checking')

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        const ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          if (cancelled) return
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          setMicLevel(avg / 128) // normalize 0-1
          animFrameRef.current = requestAnimationFrame(tick)
        }
        tick()

        setTimeout(() => {
          if (!cancelled) setMicStatus('pass')
        }, 800)
      })
      .catch(() => {
        if (!cancelled) setMicStatus('fail')
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Run camera check
  useEffect(() => {
    setCameraStatus('checking')
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop())
        setTimeout(() => setCameraStatus('pass'), 600)
      })
      .catch(() => {
        setTimeout(() => setCameraStatus('fail'), 600)
      })
  }, [])

  const allPassed = micStatus === 'pass' && cameraStatus === 'pass' && connectionStatus === 'pass'
  const anyFailed = micStatus === 'fail' || cameraStatus === 'fail' || connectionStatus === 'fail'

  const handleStart = () => {
    // Clean up mic test stream
    cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())

    setCountdown(3)
  }

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      onReady()
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, onReady])

  // Countdown overlay
  if (countdown !== null) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '1s' }} />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-indigo-600/30 ring-2 ring-indigo-500/50">
            <span className="text-6xl font-bold text-white tabular-nums">
              {countdown || ''}
            </span>
          </div>
        </div>
        <p className="text-sm text-white/50">
          {countdown > 0 ? 'Get ready...' : 'Starting...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white">Before we begin</h2>
        <p className="mt-2 text-sm text-white/50">Let's make sure everything is set up</p>
      </div>

      {/* Checks */}
      <div className="space-y-3 mb-8">
        {/* Mic Check */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon status={micStatus} />
              <div>
                <p className="text-sm font-medium text-white">Microphone</p>
                <p className="text-xs text-white/40">
                  {micStatus === 'checking' && 'Requesting access...'}
                  {micStatus === 'pass' && 'Working — try speaking to see the level'}
                  {micStatus === 'fail' && 'Blocked — allow mic access in your browser'}
                  {micStatus === 'pending' && 'Waiting...'}
                </p>
              </div>
            </div>
          </div>
          {/* Mic level bar */}
          {micStatus === 'pass' && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.min(micLevel * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-white/30 w-12 text-right">
                {micLevel > 0.05 ? 'Detected' : 'Silent'}
              </span>
            </div>
          )}
        </div>

        {/* Camera Check */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <StatusIcon status={cameraStatus} />
            <div>
              <p className="text-sm font-medium text-white">Camera</p>
              <p className="text-xs text-white/40">
                {cameraStatus === 'checking' && 'Requesting camera access...'}
                {cameraStatus === 'pass' && 'Working — your photo will be captured for verification'}
                {cameraStatus === 'fail' && 'Blocked — allow camera access in your browser settings and refresh'}
                {cameraStatus === 'pending' && 'Waiting...'}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Check */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <StatusIcon status={connectionStatus} />
            <div>
              <p className="text-sm font-medium text-white">Connection</p>
              <p className="text-xs text-white/40">
                {connectionStatus === 'checking' && 'Testing connection...'}
                {connectionStatus === 'pass' && 'Connected — low latency'}
                {connectionStatus === 'fail' && 'Connection issue — check your network'}
                {connectionStatus === 'pending' && 'Waiting...'}
              </p>
            </div>
          </div>
        </div>

        {/* Interview Info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
              <FileText className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{jdTitle}</p>
              <p className="text-xs text-white/40">{durationMinutes} minutes &middot; Technical interview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-2">Quick tips</p>
        <ul className="space-y-1.5 text-xs text-white/40">
          <li className="flex items-start gap-2">
            <ChevronRight className="h-3 w-3 mt-0.5 text-indigo-400 shrink-0" />
            Speak clearly and take a moment to think before answering
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-3 w-3 mt-0.5 text-indigo-400 shrink-0" />
            It's okay to ask the interviewer to repeat or clarify a question
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-3 w-3 mt-0.5 text-indigo-400 shrink-0" />
            Use specific examples from your experience when possible
          </li>
        </ul>
      </div>

      {/* Start Button */}
      {anyFailed && (
        <Button
          size="lg"
          variant="outline"
          className="w-full mb-3"
          onClick={() => window.location.reload()}
        >
          Retry Checks
        </Button>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={!allPassed}
        onClick={handleStart}
      >
        {allPassed ? 'Start Interview' : anyFailed ? 'Fix issues above to continue' : 'Completing checks...'}
      </Button>
    </div>
  )
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'pending' || status === 'checking') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
        {status === 'checking' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-white/30" />
        )}
      </div>
    )
  }
  if (status === 'pass') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 animate-in scale-in duration-300">
        <Check className="h-4 w-4 text-emerald-400" />
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
      <AlertCircle className="h-4 w-4 text-red-400" />
    </div>
  )
}
