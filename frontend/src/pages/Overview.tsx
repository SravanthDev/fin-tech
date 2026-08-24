import { useQuery } from "@tanstack/react-query"
import { CashFlowChart } from "@/components/dashboard/CashFlowChart"
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard"
import { MoneyAccounts } from "@/components/dashboard/MoneyAccounts"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { SpendingBreakdown } from "@/components/dashboard/SpendingBreakdown"
import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { apiRequest } from "@/lib/api"
import type { DashboardSummary } from "@/types"

export default function Overview() {
  const { user } = useAuth()
  const firstName = user?.name?.split(" ")[0] ?? "there"

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiRequest<DashboardSummary>("/api/dashboard/summary"),
  })

  return (
    <div>
      <PageHeader title={`Good morning, ${firstName}`} subtitle="Here's how your business is doing today." />

      <div className="space-y-6 px-6 pb-10 md:px-8">
        {isLoading || !summary ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <HealthScoreCard summary={summary} />
        )}

        {isLoading || !summary ? (
          <div className="flex flex-col gap-4 sm:flex-row">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 flex-1 rounded-xl" />
            ))}
          </div>
        ) : (
          <MoneyAccounts summary={summary} />
        )}

        {isLoading || !summary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <SummaryCards summary={summary} />
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <CashFlowChart />
          </div>
          <SpendingBreakdown />
        </div>

        <RecentTransactions />
      </div>
    </div>
  )
}
