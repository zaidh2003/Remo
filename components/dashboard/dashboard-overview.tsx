"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ForecastChart } from "./forecast-chart"
import { TaskBoard } from "./task-board"
import { Users, TrendingUp, AlertTriangle, Car, Loader2 } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  const [stats, setStats]     = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)

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
          totalStaff:  staffSnap.size,
          openAlerts:  alertsSnap.size,
          pendingTaxis: taxiSnap.size,
          openSwaps:   swapSnap.size,
        })
      } catch {
        // silently fall back to nulls
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Staff",
      value: loading ? "…" : String(stats?.totalStaff ?? 0),
      sub: "Registered accounts",
      icon: Users,
      tab: "staff",
    },
    {
      title: "Open Alerts",
      value: loading ? "…" : String(stats?.openAlerts ?? 0),
      sub: "Shortage vacancies",
      icon: AlertTriangle,
      tab: "shortage",
    },
    {
      title: "Pending Taxis",
      value: loading ? "…" : String(stats?.pendingTaxis ?? 0),
      sub: "Awaiting approval",
      icon: Car,
      tab: "taxi",
    },
    {
      title: "Open Swaps",
      value: loading ? "…" : String(stats?.openSwaps ?? 0),
      sub: "Shift swap requests",
      icon: TrendingUp,
      tab: "emergencies",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Live stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => onNavigate?.(stat.tab)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ForecastChart />
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button type="button" onClick={() => onNavigate?.("scheduler")}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Generate Weekly Schedule
            </button>
            <button type="button" onClick={() => onNavigate?.("shortage")}
              className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
              View Shortage Alerts
            </button>
            <button type="button" onClick={() => onNavigate?.("staff")}
              className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
              Staff Directory
            </button>
            <button type="button" onClick={() => onNavigate?.("taxi")}
              className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
              Transport Requests
            </button>
          </CardContent>
        </Card>
      </div>

      <TaskBoard />
    </div>
  )
}
