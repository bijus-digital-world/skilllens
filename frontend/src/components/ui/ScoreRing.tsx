import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  maxScore: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  showScore?: boolean
  delay?: number
}

export function ScoreRing({
  score,
  maxScore,
  size = 120,
  strokeWidth = 8,
  className,
  label,
  showScore = true,
  delay = 100,
}: ScoreRingProps) {
  const [animated, setAnimated] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true)

      // Count-up animation
      if (!showScore) return
      const duration = 1200
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayScore(Math.round(eased * score * 10) / 10)
        if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [score, delay, showScore])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(score / maxScore, 1)
  const offset = circumference * (1 - (animated ? percentage : 0))

  const ratio = score / maxScore
  const getColor = () => {
    if (ratio >= 0.7) return { stroke: '#10b981', text: 'text-emerald-600' }
    if (ratio >= 0.5) return { stroke: '#f59e0b', text: 'text-amber-600' }
    return { stroke: '#ef4444', text: 'text-red-600' }
  }
  const colors = getColor()

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: `stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            }}
          />
        </svg>
        {showScore && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-bold tracking-tight tabular-nums', colors.text)}
              style={{ fontSize: size * 0.22 }}
            >
              {displayScore}
            </span>
            <span className="text-[10px] font-medium text-slate-400">of {maxScore}</span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs font-medium text-slate-500">{label}</span>
      )}
    </div>
  )
}
