"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ForecastChart } from "./forecast-chart"
import { TaskBoard } from "./task-board"
import { useAuth } from "@/components/providers/auth-provider"
import { getAllUsers } from "@/lib/services/user-service"
import { getShifts } from "@/lib/services/data-service"
import { subscribeToNotifications } from "@/lib/services/data-service"
import type { Shift } from "@/lib/types"
import {
  Users, TrendingUp, DollarSign, Clock,
  Calendar, MapPin, ArrowRightLeft, Bell
} from "lucide-react"

interface DashboardOverviewProps {
  onNavigate?: (tab: string) => void
}

// ── Employee: My Shifts Card ───────────────────────────────────────────────────
function MyShiftsCard({ uid, onNavigate }: { uid: string; onNavigate?: (tab: string) => void }) {
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getShifts().then((all) => {
      const mine = all
        .filter((s) => s.staffId === uid)
        .sort((a, b) => a.day.localeCompare(b.day))
        .slice(0, 5) // show upcoming 5
      setMyShifts(mine)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [uid])

  const dayOrder = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
  const sortedShifts = [...myShifts].sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  )

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            My Shifts This Week
          </CardTitle>
          <button
            onClick={() => onNavigate?.("swaps")}
            className="text-xs text-primary hover:underline font-medium"
          >
            Request Swap →
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sortedShifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No shifts scheduled this week.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedShifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {shift.day.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{shift.zone}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {shift.startTime} – {shift.endTime}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  shift.status === "optimal" ? "bg-green-500/15 text-green-400" :
                  shift.status === "vacant"  ? "bg-red-500/15 text-red-400" :
                  "bg-primary/10 text-primary"
                }`}>
                  {shift.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Employee: Quick Actions Card ───────────────────────────────────────────────
function EmployeeQuickActions({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          onClick={() => onNavigate?.("shortage")}
          className="w-full rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 text-sm font-medium transition-colors hover:bg-red-500/20 cursor-pointer text-left flex items-center gap-2"
        >
          <Bell className="h-4 w-4" /> Report Sick Leave
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("swaps")}
          className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 cursor-pointer text-left flex items-center gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" /> Request Shift Swap
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("taxi")}
          className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 cursor-pointer text-left flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" /> Request Transport
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("tasks")}
          className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 cursor-pointer text-left flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" /> View My Tasks
        </button>
      </CardContent>
    </Card>
  )
}

// ── Manager/Admin: Live KPI Stats ──────────────────────────────────────────────
function LiveKPIs({ role, branch }: { role: string; branch?: string }) {
  const [staffCount, setStaffCount]     = useState<number | null>(null)
  const [shiftCount, setShiftCount]     = useState<number | null>(null)
  const [vacantCount, setVacantCount]   = useState<number | null>(null)
  const [unreadCount, setUnreadCount]   = useState<number | null>(null)

  const isAdmin = role === "ADMIN"

  useEffect(() => {
    // Staff count — admin sees all, manager sees own branch only
    getAllUsers().then((users) => {
      const filtered = isAdmin ? users : users.filter((u) => u.branch === branch)
      setStaffCount(filtered.length)
    }).catch(() => {})
    // Shift count — admin sees all, manager sees own branch
    getShifts().then((shifts) => {
      const filtered = isAdmin ? shifts : shifts.filter((s) => s.branchId === branch)
      setShiftCount(filtered.length)
      setVacantCount(filtered.filter((s) => s.status === "vacant").length)
    }).catch(() => {})
    // Unread notifications
    const unsub = subscribeToNotifications("all", (notifs) => {
      setUnreadCount(notifs.filter((n) => !n.read).length)
    })
    return () => unsub()
  }, [role, branch])

  const fmt = (v: number | null) => v === null ? "…" : String(v)

  const stats = [
    {
      title: "Active Staff",
      value: fmt(staffCount),
      change: isAdmin ? "All branches" : `Branch: ${branch || "—"}`,
      icon: Users,
    },
    {
      title: "Shifts This Week",
      value: fmt(shiftCount),
      change: `${fmt(vacantCount)} vacant`,
      icon: Calendar,
    },
    {
      title: "Labor Cost Today",
      value: "$1,247",
      change: "–8% vs budget",
      icon: DollarSign,
    },
    {
      title: "Open Notifications",
      value: fmt(unreadCount),
      change: "Unread alerts",
      icon: Bell,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Manager Quick Actions ──────────────────────────────────────────────────────
function ManagerQuickActions({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          onClick={() => onNavigate?.("scheduler")}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
        >
          Generate Weekly Schedule
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("emergencies")}
          className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 cursor-pointer"
        >
          Review Emergency Shifts
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("staff")}
          className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 cursor-pointer"
        >
          Update Staff Directory
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("shortage")}
          className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 cursor-pointer"
        >
          View Shortage Alerts
        </button>
      </CardContent>
    </Card>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { profile } = useAuth()
  const isEmployee = profile?.role === "EMPLOYEE"
  
  if (!profile) {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  if (isEmployee) {
    // Employee view: My Shifts + Quick Actions + Task Board
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MyShiftsCard uid={profile!.uid} onNavigate={onNavigate} />
          <EmployeeQuickActions onNavigate={onNavigate} />
        </div>
        <TaskBoard />
      </div>
    )
  }

  // Admin / Manager view: Live KPIs + Forecast + Quick Actions + Task Board
  return (
    <div className="space-y-6">
      <LiveKPIs role={profile!.role} branch={profile?.branch} />
      <div className="grid gap-6 lg:grid-cols-3">
        <ForecastChart />
        <ManagerQuickActions onNavigate={onNavigate} />
      </div>
      <TaskBoard />
    </div>
  )
}
