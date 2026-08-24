import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest } from "@/lib/api"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CashFlowPoint } from "@/types"

const PERIODS = [
  { key: "30d", label: "30D" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "all", label: "All" },
] as const

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  )
}

export function CashFlowChart() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("6m")

  const { data, isLoading } = useQuery({
    queryKey: ["cashflow", period],
    queryFn: () => apiRequest<{ points: CashFlowPoint[] }>("/api/dashboard/cashflow", { params: { period } }),
  })

  return (
    <div className="card-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Cash Flow</h3>
          <p className="text-sm text-muted-foreground">Income vs Expenses</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                period === p.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : !data?.points.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No transactions in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatINR(v)}
                width={64}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="var(--color-success)"
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="var(--color-warning)"
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
