import type { ReactNode } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAuth } from "@/context/AuthContext"
import Assistant from "@/pages/Assistant"
import History from "@/pages/History"
import Login from "@/pages/Login"
import Overview from "@/pages/Overview"
import Profile from "@/pages/Profile"
import Signup from "@/pages/Signup"

// TEMP: login is commented out while the app is under active development —
// AuthContext silently signs into a fixed dev account instead. Restore the
// commented lines below (and see AuthContext.tsx) to bring login back.
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }

  // if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { loading } = useAuth()
  if (loading) return null
  // if (user) return <Navigate to="/overview" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/overview" element={<Overview />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  )
}
