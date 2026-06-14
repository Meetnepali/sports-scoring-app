"use client"

interface FutsalPitchProps {
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: { home: number; away: number }
  period: string
  goals: Array<{ team: string; player?: string; time?: string; minute?: number }>
}

export default function FutsalPitch({
  homeTeam,
  awayTeam,
  score,
  period,
  goals,
}: FutsalPitchProps) {
  // Period indicator steps
  const periods = ["First Half", "Second Half", "Extra Time", "Penalties", "Full Time"]
  const currentPeriodIndex = periods.indexOf(period)

  return (
    <div className="w-full space-y-4">
      {/* Period Indicator Bar */}
      <div className="flex items-center gap-1 px-2">
        {periods.map((p, i) => (
          <div key={p} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-2 w-full rounded-full transition-colors ${
                i <= currentPeriodIndex
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            />
            <span
              className={`text-[10px] leading-tight text-center ${
                p === period ? "font-bold text-green-700" : "text-gray-400"
              }`}
            >
              {p}
            </span>
          </div>
        ))}
      </div>

      {/* Current Period Label */}
      <div className="text-center">
        <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
          {period}
        </span>
      </div>

      {/* Pitch SVG */}
      <div className="relative w-full" style={{ aspectRatio: "2 / 1.1" }}>
        <svg
          viewBox="0 0 800 440"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Pitch background */}
          <rect x="0" y="0" width="800" height="440" rx="8" fill="#2d8a4e" />

          {/* Pitch outline */}
          <rect
            x="40" y="20" width="720" height="400" rx="4"
            fill="none" stroke="white" strokeWidth="2.5"
          />

          {/* Center line */}
          <line x1="400" y1="20" x2="400" y2="420" stroke="white" strokeWidth="2.5" />

          {/* Center circle */}
          <circle cx="400" cy="220" r="60" fill="none" stroke="white" strokeWidth="2.5" />

          {/* Center spot */}
          <circle cx="400" cy="220" r="4" fill="white" />

          {/* Left goal area (D-shaped) */}
          <rect
            x="40" y="130" width="80" height="180"
            fill="none" stroke="white" strokeWidth="2"
          />

          {/* Left penalty arc */}
          <path
            d="M 120 130 A 90 90 0 0 1 120 310"
            fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="6 4"
          />

          {/* Left penalty spot */}
          <circle cx="100" cy="220" r="4" fill="white" />

          {/* Left second penalty spot */}
          <circle cx="160" cy="220" r="3" fill="white" opacity="0.7" />

          {/* Left goal */}
          <rect x="28" y="180" width="12" height="80" fill="white" opacity="0.3" rx="2" />
          <rect x="28" y="180" width="12" height="80" fill="none" stroke="white" strokeWidth="2" rx="2" />

          {/* Right goal area (D-shaped) */}
          <rect
            x="680" y="130" width="80" height="180"
            fill="none" stroke="white" strokeWidth="2"
          />

          {/* Right penalty arc */}
          <path
            d="M 680 130 A 90 90 0 0 0 680 310"
            fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="6 4"
          />

          {/* Right penalty spot */}
          <circle cx="700" cy="220" r="4" fill="white" />

          {/* Right second penalty spot */}
          <circle cx="640" cy="220" r="3" fill="white" opacity="0.7" />

          {/* Right goal */}
          <rect x="760" y="180" width="12" height="80" fill="white" opacity="0.3" rx="2" />
          <rect x="760" y="180" width="12" height="80" fill="none" stroke="white" strokeWidth="2" rx="2" />

          {/* Corner arcs */}
          <path d="M 40 45 A 25 25 0 0 1 65 20" fill="none" stroke="white" strokeWidth="2" />
          <path d="M 40 395 A 25 25 0 0 0 65 420" fill="none" stroke="white" strokeWidth="2" />
          <path d="M 760 45 A 25 25 0 0 0 735 20" fill="none" stroke="white" strokeWidth="2" />
          <path d="M 760 395 A 25 25 0 0 1 735 420" fill="none" stroke="white" strokeWidth="2" />

          {/* Substitution zones (dashed lines on the sideline) */}
          <line x1="340" y1="418" x2="340" y2="430" stroke="yellow" strokeWidth="2" />
          <line x1="460" y1="418" x2="460" y2="430" stroke="yellow" strokeWidth="2" />
          <line x1="340" y1="10" x2="340" y2="22" stroke="yellow" strokeWidth="2" />
          <line x1="460" y1="10" x2="460" y2="22" stroke="yellow" strokeWidth="2" />

          {/* Home team name - left side */}
          <text
            x="200" y="220"
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontWeight="bold"
            opacity="0.8"
          >
            {homeTeam.name}
          </text>

          {/* Away team name - right side */}
          <text
            x="600" y="220"
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontWeight="bold"
            opacity="0.8"
          >
            {awayTeam.name}
          </text>

          {/* Score display at center */}
          <rect x="340" y="170" width="120" height="60" rx="8" fill="rgba(0,0,0,0.6)" />
          <text
            x="400" y="210"
            textAnchor="middle"
            fill="white"
            fontSize="36"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {score.home} - {score.away}
          </text>
        </svg>
      </div>

      {/* Goal Timeline */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Goal Timeline</h4>
        {goals.length > 0 ? (
          <div className="space-y-2">
            {goals.map((goal, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-sm py-1.5 border-b last:border-b-0"
              >
                <span className="text-lg">&#9917;</span>
                <span className="font-medium text-gray-900">
                  {goal.player || "Unknown Player"}
                </span>
                <span className="text-gray-400">({goal.team})</span>
                <span className="ml-auto text-gray-500 font-mono text-xs">
                  {goal.minute != null ? `${goal.minute}'` : goal.time || ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-2">No goals scored yet</p>
        )}
      </div>
    </div>
  )
}
