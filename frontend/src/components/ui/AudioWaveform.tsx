import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AudioWaveformProps {
  active: boolean
  variant: 'speaking' | 'listening'
  className?: string
}

export function AudioWaveform({ active, variant, className }: AudioWaveformProps) {
  const [bars] = useState(() => Array.from({ length: 5 }, () => Math.random()))

  const baseColor = variant === 'speaking' ? 'bg-indigo-400' : 'bg-emerald-400'

  return (
    <div className={cn('flex items-center justify-center gap-[3px]', className)}>
      {bars.map((seed, i) => (
        <div
          key={i}
          className={cn(
            'w-[3px] rounded-full transition-all',
            baseColor,
            active ? 'opacity-100' : 'opacity-30'
          )}
          style={{
            height: active ? `${12 + seed * 20}px` : '4px',
            animationName: active ? 'waveform' : 'none',
            animationDuration: `${0.4 + seed * 0.4}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.08}s`,
            transition: 'height 0.3s ease, opacity 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}
