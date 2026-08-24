import { getCategoryIcon, isIncomeCategory } from "@/lib/categoryIcons"
import { formatINR, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const Icon = getCategoryIcon(transaction.category)
  const credit = transaction.type === "Credit" || isIncomeCategory(transaction.category)

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
        <p className="text-xs text-muted-foreground">
          {transaction.category} · {transaction.paymentMethod}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("text-sm font-semibold", credit ? "text-success" : "text-foreground")}>
          {credit ? "+" : "-"}
          {formatINR(Math.abs(transaction.signedAmount))}
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(transaction.date)}</p>
      </div>
    </div>
  )
}
