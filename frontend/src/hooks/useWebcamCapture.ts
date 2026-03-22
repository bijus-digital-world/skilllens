import { useRef, useCallback, useEffect } from 'react'

export function useWebcamCapture(
  onSnapshot: (base64Image: string) => void,
  intervalMs: number = 120000, // every 2 minutes
  active: boolean = false
) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jitterTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      streamRef.current = stream

      if (!videoRef.current) {
        videoRef.current = document.createElement('video')
        videoRef.current.setAttribute('playsinline', '')
        videoRef.current.muted = true
      }
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
        canvasRef.current.width = 640
        canvasRef.current.height = 480
      }

      return true
    } catch {
      return false
    }
  }, [])

  const captureSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(videoRef.current, 0, 0, 640, 480)
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7)
    return dataUrl
  }, [])

  const takeAndSendSnapshot = useCallback(() => {
    const image = captureSnapshot()
    if (image) onSnapshot(image)
  }, [captureSnapshot, onSnapshot])

  // Start periodic captures when active
  useEffect(() => {
    if (!active) return

    let cancelled = false

    startCamera().then((ok) => {
      if (!ok || cancelled) return

      // Capture immediately
      const initTimeout = setTimeout(takeAndSendSnapshot, 1000)
      jitterTimeouts.current.add(initTimeout)

      // Then at intervals with slight randomness (±30 seconds)
      intervalRef.current = setInterval(() => {
        if (cancelled) return
        const jitter = (Math.random() - 0.5) * 60000 // ±30s
        const tid = setTimeout(() => {
          if (!cancelled) takeAndSendSnapshot()
          jitterTimeouts.current.delete(tid)
        }, Math.max(0, jitter))
        jitterTimeouts.current.add(tid)
      }, intervalMs)
    })

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      // Clear all pending jitter timeouts
      jitterTimeouts.current.forEach((tid) => clearTimeout(tid))
      jitterTimeouts.current.clear()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [active, intervalMs, startCamera, takeAndSendSnapshot])

  return { captureSnapshot: takeAndSendSnapshot }
}
