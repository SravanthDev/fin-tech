import { ArrowDownCircle, PiggyBank, ShoppingBag } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { formatINR } from "@/lib/format"
import type { DashboardSummary } from "@/types"

// NOTE: there is no "Investment" category in the underlying transaction data,
// so the Invest-it balance below is a placeholder (5% of income), not a real
// derived figure like the other two. Income and Spend-it are real totals.
const INVEST_PLACEHOLDER_RATE = 0.05

interface AccountConfig {
  key: string
  name: string
  description: string
  icon: LucideIcon
  balance: number
  percentLabel: string
  barPercent: number
  tone: "success" | "warning" | "info"
}

function AccountRow({ account }: { account: AccountConfig }) {
  const Icon = account.icon
  const toneClasses: Record<string, { chip: string; bar: string }> = {
    success: { chip: "bg-success-soft text-success", bar: "bg-success" },
    warning: { chip: "bg-warning-soft text-warning", bar: "bg-warning" },
    info: { chip: "bg-info-soft text-info", bar: "bg-info" },
  }
  const tone = toneClasses[account.tone]

  return (
    <div className="flex-1 rounded-xl border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.chip}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{account.name}</p>
            <p className="text-xs text-muted-foreground">{account.description}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">{formatINR(account.balance)}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${Math.min(Math.max(account.barPercent, 2), 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{account.percentLabel}</p>
    </div>
  )
}

export function MoneyAccounts({ summary }: { summary: DashboardSummary }) {
  const { totalIncome, totalExpenses } = summary
  const spendPercent = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0
  const investBalance = totalIncome * INVEST_PLACEHOLDER_RATE

  const accounts: AccountConfig[] = [
    {
      key: "income",
      name: "Income Account",
      description: "For all income that comes in",
      icon: ArrowDownCircle,
      balance: totalIncome,
      percentLabel: "100% of total income",
      barPercent: 100,
      tone: "success",
    },
    {
      key: "spend",
      name: "Spend-it Account",
      description: "Daily expenses & operating costs",
      icon: ShoppingBag,
      balance: totalExpenses,
      percentLabel: `${spendPercent}% of income`,
      barPercent: spendPercent,
      tone: "warning",
    },
    {
      key: "invest",
      name: "Invest-it Account",
      description: "For your future & investments",
      icon: PiggyBank,
      balance: investBalance,
      percentLabel: `${Math.round(INVEST_PLACEHOLDER_RATE * 100)}% of income (est.)`,
      barPercent: INVEST_PLACEHOLDER_RATE * 100,
      tone: "info",
    },
  ]

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {accounts.map((account) => (
        <AccountRow key={account.key} account={account} />
      ))}
    </div>
  )
}
