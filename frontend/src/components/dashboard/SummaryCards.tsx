import { ArrowDownRight, ArrowUpRight, ListChecks, Wallet } from "lucide-react"
import type { ReactNode } from "react"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { DashboardSummary } from "@/types"

function Card({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string
  value: string
  icon: ReactNode
  tone: "success" | "warning" | "primary" | "info"
  hint?: string
}) {
  const toneClasses: Record<string, string> = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    primary: "bg-primary-soft text-primary",
    info: "bg-info-soft text-info",
  }

  return (
    <div className="card-surface flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneClasses[tone])}>{icon}</div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const isNetPositive = summary.netCashFlow >= 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Total Income"
        value={formatINR(summary.totalIncome)}
        icon={<ArrowDownRight className="h-4 w-4" />}
        tone="success"
        hint="Customer payments received"
      />
      <Card
        label="Total Expenses"
        value={formatINR(summary.totalExpenses)}
        icon={<ArrowUpRight className="h-4 w-4" />}
        tone="warning"
        hint="Salaries, taxes & operating costs"
      />
      <Card
        label="Net Cash Flow"
        value={formatINR(summary.netCashFlow)}
        icon={<Wallet className="h-4 w-4" />}
        tone={isNetPositive ? "success" : "warning"}
        hint={isNetPositive ? "Income exceeds expenses" : "Expenses exceed income"}
      />
      <Card
        label="Transactions"
        value={summary.transactionCount.toLocaleString("en-IN")}
        icon={<ListChecks className="h-4 w-4" />}
        tone="info"
        hint="Recorded in this dataset"
      />
    </div>
  )
}
