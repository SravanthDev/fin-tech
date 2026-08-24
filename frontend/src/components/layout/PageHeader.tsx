import { Bell } from "lucide-react"
import type { ReactNode } from "react"

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-6 md:px-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
