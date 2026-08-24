import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest } from "@/lib/api"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { formatINR } from "@/lib/format"
import type { CategoryBreakdownItem } from "@/types"

export function SpendingBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ["spending-breakdown"],
    queryFn: () => apiRequest<{ items: CategoryBreakdownItem[] }>("/api/dashboard/spending-breakdown"),
  })

  return (
    <div className="card-surface p-6">
      <h3 className="text-base font-semibold text-foreground">Spending by Category</h3>
      <p className="mb-4 text-sm text-muted-foreground">Where the money is going</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map((item) => {
            const Icon = getCategoryIcon(item.category)
            return (
              <div key={item.category} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{item.category}</span>
                    <span className="shrink-0 text-sm font-semibold text-foreground">{formatINR(item.total)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(item.percentOfExpenses, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
