import { LayoutDashboard, MessageCircleMore, History as HistoryIcon, TrendingUp, ChevronRight } from "lucide-react"
import { NavLink } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: MessageCircleMore },
  { to: "/history", label: "History", icon: HistoryIcon },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TrendingUp className="h-4.5 w-4.5" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold leading-tight text-foreground">
          Let&apos;s Talk
          <br />
          Money
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-2 px-5">
        <Separator />
      </div>

      <div className="mt-auto p-3">
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted",
              isActive && "bg-muted",
            )
          }
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary">
              {user ? initials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "Founder"}</p>
            <p className="text-xs text-muted-foreground">View Profile</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </NavLink>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border md:flex">
      <SidebarContent />
    </aside>
  )
}
