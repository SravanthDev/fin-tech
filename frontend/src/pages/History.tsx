import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { TransactionRow } from "@/components/history/TransactionRow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest } from "@/lib/api"
import { formatDateLabel, formatINR } from "@/lib/format"
import type { PaginatedTransactions, Transaction } from "@/types"

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function History() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [paymentMethod, setPaymentMethod] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Transaction[]>([])

  const debouncedSearch = useDebounced(search)

  const filterKey = { search: debouncedSearch, category, paymentMethod, startDate, endDate }

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, paymentMethod, startDate, endDate])

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiRequest<{ categories: string[] }>("/api/transactions/categories"),
  })

  const { data: paymentMethodsData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => apiRequest<{ paymentMethods: string[] }>("/api/transactions/payment-methods"),
  })

  const { data: summary } = useQuery({
    queryKey: ["transactions-summary", startDate, endDate],
    queryFn: () =>
      apiRequest<{ totalIncome: number; totalExpenses: number; netCashFlow: number }>("/api/transactions/summary", {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
      }),
  })

  const { data, isFetching } = useQuery({
    queryKey: ["transactions", filterKey, page],
    queryFn: () =>
      apiRequest<PaginatedTransactions>("/api/transactions", {
        params: {
          search: debouncedSearch || undefined,
          category,
          paymentMethod,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit: 20,
        },
      }),
  })

  useEffect(() => {
    if (!data) return
    setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]))
  }, [data, page])

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const txn of items) {
      const label = formatDateLabel(txn.date)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(txn)
    }
    return Array.from(map.entries())
  }, [items])

  const hasMore = data ? page * data.limit < data.total : false

  return (
    <div>
      <PageHeader title="Finance History" subtitle="View and analyze your financial transactions" />

      <div className="space-y-6 px-6 pb-10 md:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-surface p-5">
            <p className="text-sm font-medium text-muted-foreground">Income</p>
            <p className="mt-1 text-xl font-semibold text-success">{formatINR(summary?.totalIncome ?? 0)}</p>
          </div>
          <div className="card-surface p-5">
            <p className="text-sm font-medium text-muted-foreground">Expenses</p>
            <p className="mt-1 text-xl font-semibold text-warning">{formatINR(summary?.totalExpenses ?? 0)}</p>
          </div>
          <div className="card-surface p-5">
            <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatINR(summary?.netCashFlow ?? 0)}</p>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions…"
                className="pl-9"
              />
            </div>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {paymentMethodsData?.paymentMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesData?.categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
              <span className="text-sm text-muted-foreground">to</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
            </div>
          </div>
        </div>

        <div className="card-surface p-6">
          {isFetching && page === 1 ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No transactions match your filters.
            </div>
          ) : (
            <div>
              {groups.map(([label, txns]) => (
                <div key={label} className="border-b border-border pb-2 pt-4 first:pt-0 last:border-none">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <div className="divide-y divide-border">
                    {txns.map((txn) => (
                      <TransactionRow key={txn.id} transaction={txn} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isFetching}>
                {isFetching ? "Loading…" : "Load More Transactions"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
