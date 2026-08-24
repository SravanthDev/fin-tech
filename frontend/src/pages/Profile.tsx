import { useQuery } from "@tanstack/react-query"
import {
  Bell,
  ChevronRight,
  FileQuestion,
  Lock,
  LogOut,
  Mail,
  Palette,
  Phone,
  Shield,
  FileText,
} from "lucide-react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/layout/PageHeader"
import { UploadDataCard } from "@/components/profile/UploadDataCard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { apiRequest } from "@/lib/api"
import type { User } from "@/types"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card-surface p-6">
      <h3 className="mb-3 text-base font-semibold text-foreground">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

function Row({
  icon,
  label,
  value,
  onClick,
  danger,
}: {
  icon: ReactNode
  label: string
  value?: string
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 py-3.5 text-left transition-colors first:pt-0 last:pb-0 ${
        onClick ? "hover:opacity-70" : "cursor-default"
      }`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${danger ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${danger ? "text-warning" : "text-foreground"}`}>{label}</p>
        {value && <p className="truncate text-xs text-muted-foreground">{value}</p>}
      </div>
      {onClick && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  )
}

export default function Profile() {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()

  const { data: user } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiRequest<User>("/api/profile"),
    initialData: authUser ?? undefined,
  })

  function handleSignOut() {
    logout()
    navigate("/login")
  }

  if (!user) return null

  return (
    <div>
      <PageHeader title="Profile" />

      <div className="mx-auto max-w-3xl space-y-6 px-6 pb-10 md:px-8">
        <div className="card-surface flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary-soft text-xl font-semibold text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user.transactionCount} transactions on file</p>
          </div>
        </div>

        <SectionCard title="Account">
          <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone ?? "Not added yet"} />
          <Row icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
          <Row icon={<Lock className="h-4 w-4" />} label="Change password / security" onClick={() => {}} />
        </SectionCard>

        <SectionCard title="Preferences">
          <Row icon={<Palette className="h-4 w-4" />} label="Theme" value="Light" onClick={() => {}} />
          <Row icon={<Bell className="h-4 w-4" />} label="Notifications" value="Enabled" onClick={() => {}} />
        </SectionCard>

        <UploadDataCard user={user} />

        <SectionCard title="General">
          <Row icon={<FileQuestion className="h-4 w-4" />} label="Help & FAQ" onClick={() => {}} />
          <Row icon={<Shield className="h-4 w-4" />} label="Privacy" onClick={() => {}} />
          <Row icon={<FileText className="h-4 w-4" />} label="Terms" onClick={() => {}} />
          <Row icon={<LogOut className="h-4 w-4" />} label="Sign out" onClick={handleSignOut} danger />
        </SectionCard>
      </div>
    </div>
  )
}
