import type { DashboardSummary } from "@/types"

const LABEL_COLORS: Record<string, string> = {
  Excellent: "oklch(0.6 0.14 150)",
  Good: "oklch(0.6 0.14 150)",
  Caution: "oklch(0.68 0.16 45)",
  "Needs attention": "oklch(0.58 0.22 25)",
}

export function HealthScoreCard({ summary }: { summary: DashboardSummary }) {
  const { healthScore, healthScoreLabel, healthScoreMessage } = summary
  const color = LABEL_COLORS[healthScoreLabel] ?? "oklch(0.55 0.18 258)"
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - healthScore / 100)

  return (
    <div className="card-surface flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Finance Health Score</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          {healthScore}
          <span className="text-lg font-medium text-muted-foreground"> / 100</span>
        </p>
        <p className="mt-2 text-sm font-medium" style={{ color }}>
          {healthScoreLabel}
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{healthScoreMessage}</p>
      </div>

      <div className="relative flex h-32 w-32 shrink-0 items-center justify-center self-center">
        <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className="absolute text-xl font-semibold text-foreground">{healthScore}%</span>
      </div>
    </div>
  )
}
