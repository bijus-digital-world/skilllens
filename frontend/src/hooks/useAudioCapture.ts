import { useRef, useCallback, useState } from 'react'

const TARGET_SAMPLE_RATE = 16000
const BUFFER_SIZE = 4096
const SILENCE_THRESHOLD = 0.01 // RMS below this = silence, skip sending

function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return int16Array
}

// Linear interpolation downsampling — much better quality than nearest-neighbor
function downsample(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) return buffer
  const ratio = inputRate / outputRate
  const newLength = Math.round(buffer.length / ratio)
  const result = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio
    const index = Math.floor(pos)
    const frac = pos - index
    const a = buffer[index] ?? 0
    const b = buffer[Math.min(index + 1, buffer.length - 1)] ?? 0
    result[i] = a + frac * (b - a)
  }
  return result
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Calculate RMS level of audio buffer
function getRMS(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  return Math.sqrt(sum / buffer.length)
}

export function useAudioCapture(onAudioChunk: (base64: string) => void) {
  const [isCapturing, setIsCapturing] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  // Track consecutive silence frames — send occasional silence to keep stream alive
  const silenceCountRef = useRef(0)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: TARGET_SAMPLE_RATE,
          channelCount: 1,
        },
      })

      const nativeSampleRate = stream.getAudioTracks()[0].getSettings().sampleRate || 48000
      const audioContext = new AudioContext({ sampleRate: nativeSampleRate })
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1)

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        const downsampled = downsample(inputData, audioContext.sampleRate, TARGET_SAMPLE_RATE)

        // Check if this chunk is silence
        const rms = getRMS(downsampled)
        if (rms < SILENCE_THRESHOLD) {
          silenceCountRef.current++
          // Send one silence frame every ~2 seconds to keep the stream alive
          // At 16kHz with 4096 buffer, each chunk is ~85ms at 48kHz input → ~256ms output
          // So every 8 chunks is ~2 seconds
          if (silenceCountRef.current % 8 !== 0) return
        } else {
          silenceCountRef.current = 0
        }

        const int16 = float32ToInt16(downsampled)
        const base64 = arrayBufferToBase64(int16.buffer)
        onAudioChunk(base64)
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      streamRef.current = stream
      audioContextRef.current = audioContext
      processorRef.current = processor
      silenceCountRef.current = 0
      setIsCapturing(true)
    } catch (err) {
      console.error('Mic access error:', err)
      throw err
    }
  }, [onAudioChunk])

  const stop = useCallback(() => {
    processorRef.current?.disconnect()
    audioContextRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    processorRef.current = null
    audioContextRef.current = null
    streamRef.current = null
    setIsCapturing(false)
  }, [])

  return { isCapturing, start, stop }
}
