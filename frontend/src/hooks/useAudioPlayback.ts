import { useRef, useCallback } from 'react'

const OUTPUT_SAMPLE_RATE = 24000
const CROSSFADE_SAMPLES = 64 // Smooth transitions between chunks to avoid clicks

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function int16ToFloat32(int16Array: Int16Array): Float32Array {
  const float32Array = new Float32Array(int16Array.length)
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 0x7fff
  }
  return float32Array
}

export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const nextStartTimeRef = useRef(0)
  const lastSamplesRef = useRef<Float32Array | null>(null) // For crossfading

  const getContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE })
      audioContextRef.current = ctx

      // Gain node for volume control and smooth transitions
      const gain = ctx.createGain()
      gain.gain.value = 1.0
      gain.connect(ctx.destination)
      gainNodeRef.current = gain

      nextStartTimeRef.current = 0
      lastSamplesRef.current = null
    }
    return audioContextRef.current
  }, [])

  const playChunk = useCallback(
    (base64Audio: string) => {
      const ctx = getContext()
      const arrayBuffer = base64ToArrayBuffer(base64Audio)
      const int16 = new Int16Array(arrayBuffer)
      const float32 = int16ToFloat32(int16)

      // Crossfade with previous chunk's tail to avoid clicking
      if (lastSamplesRef.current && float32.length > CROSSFADE_SAMPLES) {
        const prev = lastSamplesRef.current
        for (let i = 0; i < CROSSFADE_SAMPLES && i < prev.length; i++) {
          const t = i / CROSSFADE_SAMPLES // 0 → 1
          float32[i] = prev[i] * (1 - t) + float32[i] * t
        }
      }

      // Save tail for next crossfade
      if (float32.length > CROSSFADE_SAMPLES) {
        lastSamplesRef.current = float32.slice(-CROSSFADE_SAMPLES)
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE)
      audioBuffer.copyToChannel(float32, 0)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(gainNodeRef.current || ctx.destination)

      const now = ctx.currentTime
      const startTime = Math.max(now, nextStartTimeRef.current)
      source.start(startTime)
      nextStartTimeRef.current = startTime + audioBuffer.duration
    },
    [getContext]
  )

  const stop = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
      gainNodeRef.current = null
      nextStartTimeRef.current = 0
      lastSamplesRef.current = null
    }
  }, [])

  return { playChunk, stop }
}
