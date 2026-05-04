import React from 'react'

interface MetatronCubeProps {
  size?: number
}

export default function MetatronCube({ size = 260 }: MetatronCubeProps) {
  const d = 70
  const centers: [number, number][] = [[0, 0]]
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 - 30) * Math.PI) / 180
    centers.push([d * Math.cos(a), d * Math.sin(a)])
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 * Math.PI) / 180
    centers.push([2 * d * Math.cos(a), 2 * d * Math.sin(a)])
  }
  const lines: [[number, number], [number, number]][] = []
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      lines.push([centers[i], centers[j]])
    }
  }
  const vb = d * 2.65
  const gid = `mg${size}`

  return (
    <svg
      viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`}
      width={size}
      height={size}
      style={{
        display: 'block',
        filter: 'drop-shadow(0 0 14px #C8942A88)',
        opacity: 0.85,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="50%" stopColor="#C8942A" />
          <stop offset="100%" stopColor="#8B5E10" />
        </linearGradient>
        <radialGradient id={`${gid}g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8A030" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#C8942A" stopOpacity="0" />
        </radialGradient>
        <style>{`
          @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes rotateRev  { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
          @keyframes pulseGold  { 0%,100%{ opacity:.55; } 50%{ opacity:1; } }
          .mc-ring1 { animation: rotateSlow 30s linear infinite; transform-origin: center; }
          .mc-ring2 { animation: rotateRev  40s linear infinite; transform-origin: center; }
          .mc-pulse { animation: pulseGold   4s ease-in-out infinite; }
        `}</style>
      </defs>

      <circle cx="0" cy="0" r={vb * 0.82} fill={`url(#${gid}g)`} />

      <g className="mc-ring2" opacity="0.35">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180
          return <circle key={i} cx={vb * 0.7 * Math.cos(a)} cy={vb * 0.7 * Math.sin(a)} r={3.5} fill="#C8942A" />
        })}
        <circle cx="0" cy="0" r={vb * 0.7} fill="none" stroke="#C8942A" strokeWidth="0.7" strokeDasharray="5 9" />
      </g>

      <g className="mc-ring1" opacity="0.55">
        {lines.map(([a, b], i) => (
          <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={`url(#${gid})`} strokeWidth="0.7" />
        ))}
      </g>

      <g className="mc-pulse">
        {centers.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={d}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={i === 0 ? 1.6 : 1.0}
            strokeOpacity={i === 0 ? 0.95 : 0.7}
          />
        ))}
      </g>

      <g className="mc-ring1" opacity="0.65">
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * 60 * Math.PI) / 180
          const a2 = ((i * 60 + 30) * Math.PI) / 180
          return (
            <line
              key={i}
              x1={d * 0.12 * Math.cos(a)}
              y1={d * 0.12 * Math.sin(a)}
              x2={d * 0.88 * Math.cos(a2)}
              y2={d * 0.88 * Math.sin(a2)}
              stroke="#FFE08A"
              strokeWidth="0.9"
            />
          )
        })}
      </g>

      <circle cx="0" cy="0" r="5.5" fill="#FFE08A" opacity="0.95" />
      <circle cx="0" cy="0" r="2.5" fill="white" />
    </svg>
  )
}
