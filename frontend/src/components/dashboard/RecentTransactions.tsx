import { useQuery } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest } from "@/lib/api"
import { getCategoryIcon, isIncomeCategory } from "@/lib/categoryIcons"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"

export function RecentTransactions() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: () => apiRequest<{ items: Transaction[] }>("/api/dashboard/recent-transactions", { params: { limit: 6 } }),
  })

  return (
    <div className="card-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Recent Transactions</h3>
        <Link
          to="/history"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all transactions <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {data?.items.map((txn) => {
            const Icon = getCategoryIcon(txn.category)
            const credit = txn.type === "Credit" || isIncomeCategory(txn.category)
            return (
              <div key={txn.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {txn.category} · {new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <span className={cn("shrink-0 text-sm font-semibold", credit ? "text-success" : "text-foreground")}>
                  {credit ? "+" : "-"}
                  {formatINR(Math.abs(txn.signedAmount))}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
