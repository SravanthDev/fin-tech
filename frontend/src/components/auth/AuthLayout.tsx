import { TrendingUp } from "lucide-react"
import type { ReactNode } from "react"

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <TrendingUp className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Let&apos;s Talk Money</h1>
            <p className="text-sm text-muted-foreground">Your private financial command center</p>
          </div>
        </div>

        <div className="card-surface p-8">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}
