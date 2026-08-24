import { Menu, TrendingUp } from "lucide-react"
import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SidebarContent, Sidebar } from "@/components/layout/Sidebar"

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold">Let&apos;s Talk Money</span>
          </div>
        </div>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
