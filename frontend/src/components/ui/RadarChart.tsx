interface RadarChartProps {
  labels: string[]
  datasets: Array<{
    label: string
    values: number[]
    color: string
  }>
  maxValue: number
  size?: number
}

const COLORS = [
  { fill: 'rgba(79, 70, 229, 0.15)', stroke: '#4f46e5' },
  { fill: 'rgba(16, 185, 129, 0.15)', stroke: '#10b981' },
  { fill: 'rgba(245, 158, 11, 0.15)', stroke: '#f59e0b' },
  { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' },
  { fill: 'rgba(168, 85, 247, 0.15)', stroke: '#a855f7' },
]

export function RadarChart({ labels, datasets, maxValue, size = 300 }: RadarChartProps) {
  const center = size / 2
  const radius = size * 0.38
  const angleStep = (2 * Math.PI) / labels.length

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / maxValue) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const points = labels
          .map((_, i) => {
            const p = getPoint(i, maxValue * level)
            return `${p.x},${p.y}`
          })
          .join(' ')
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        )
      })}

      {/* Axes */}
      {labels.map((_, i) => {
        const p = getPoint(i, maxValue)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygons */}
      {datasets.map((dataset, di) => {
        const c = COLORS[di % COLORS.length]
        const points = dataset.values
          .map((v, i) => {
            const p = getPoint(i, v)
            return `${p.x},${p.y}`
          })
          .join(' ')
        return (
          <g key={di}>
            <polygon
              points={points}
              fill={c.fill}
              stroke={c.stroke}
              strokeWidth={2}
              style={{
                opacity: 0,
                animation: `fade-in 500ms ease-out ${di * 200}ms forwards`,
              }}
            />
            {/* Data points */}
            {dataset.values.map((v, i) => {
              const p = getPoint(i, v)
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill={c.stroke}
                  style={{
                    opacity: 0,
                    animation: `fade-in 300ms ease-out ${di * 200 + 300}ms forwards`,
                  }}
                />
              )
            })}
          </g>
        )
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const p = getPoint(i, maxValue * 1.18)
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[10px] fill-slate-500 font-medium"
          >
            {label.length > 12 ? label.slice(0, 12) + '...' : label}
          </text>
        )
      })}
    </svg>
  )
}
