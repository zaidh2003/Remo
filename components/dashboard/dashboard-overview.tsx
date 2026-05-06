"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ForecastChart } from "./forecast-chart"
import { TaskBoard } from "./task-board"
import { Users, AlertTriangle, Car, TrendingUp, Loader2 } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/providers/auth-provider"

interface LiveStats {
  totalStaff: number
  openAlerts: number
  pendingTaxis: number
  openSwaps: number
}

interface DashboardOverviewProps {
  onNavigate?: (tab: string) => void
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { profile } = useAuth()
  const [stats, setStats]     = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)
  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [staffSnap, alertsSnap, taxiSnap, swapSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(query(collection(db, "shortageAlerts"), where("status", "==", "OPEN"))),
          getDocs(query(collection(db, "taxis"), where("status", "==", "PENDING"))),
          getDocs(query(collection(db, "swapRequests"), where("status", "==", "OPEN"))),
        ])
        setStats({
          totalStaff:   staffSnap.size,
          openAlerts:   alertsSnap.size,
          pendingTaxis: taxiSnap.size,
          openSwaps:    swapSnap.size,
        })
      } catch {
        // silently fall back
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { title: "Total Staff",    value: stats?.totalStaff,   sub: "Registered accounts",  icon: Users,         tab: "staff" },
    { title: "Open Alerts",    value: stats?.openAlerts,   sub: "Shortage vacancies",   icon: AlertTriangle, tab: "shortage" },
    { title: "Pending Taxis",  value: stats?.pendingTaxis, sub: "Awaiting approval",    icon: Car,           tab: "taxi" },
    { title: "Open Swaps",     value: stats?.openSwaps,    sub: "Shift swap requests",  icon: TrendingUp,    tab: "emergencies" },
  ]

  return (
    <div className="space-y-6">
      {/* Live stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card
            key={s.title}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => onNavigate?.(s.tab)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{s.value ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Quick Actions (manager/admin only) */}
      <div className={`grid gap-6 ${isManagerOrAdmin ? "lg:grid-cols-3" : ""}`}>
        <ForecastChart />
        {isManagerOrAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => onNavigate?.("scheduler")}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Weekly Schedule
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.("shortage")}
                className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                Shortage Alerts
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.("staff")}
                className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                Staff Directory
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.("taxi")}
                className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                Transport Requests
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      <TaskBoard />
    </div>
  )
}
