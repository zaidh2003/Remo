"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { getAllUsers } from "@/lib/services/user-service"
import {
  saveShift, saveTask, seedInventoryData, sendNotification,
  createSwapRequest, saveForecastEntry,
} from "@/lib/services/data-service"
import { createShortageAlert } from "@/lib/services/user-service"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import {
  Database, CheckCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp,
  Users, Calendar, ClipboardList, Package, ArrowRightLeft, BellRing,
  CarFront, TrendingUp, Sparkles
} from "lucide-react"
import { toast } from "sonner"
import type { UserProfile } from "@/lib/services/user-service"

// ── Helpers ────────────────────────────────────────────────────────────────────
function getWeekLabel() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return monday.toISOString().split("T")[0]
}

function todayStr() { return new Date().toISOString().split("T")[0] }
function daysFromNow(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]
}

// ── Module Seeders ─────────────────────────────────────────────────────────────

async function seedShifts(users: UserProfile[], branch: string): Promise<number> {
  const employees = users.filter((u) => u.branch === branch || !branch)
  const weekLabel = getWeekLabel()
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const schedule = [
    { zone: "Kitchen",    startTime: "09:00", endTime: "17:00" },
    { zone: "Grill",      startTime: "12:00", endTime: "20:00" },
    { zone: "Bar",        startTime: "16:00", endTime: "00:00" },
    { zone: "Waiter",     startTime: "11:00", endTime: "19:00" },
    { zone: "Waiter",     startTime: "17:00", endTime: "01:00" },
    { zone: "Host",       startTime: "11:00", endTime: "19:00" },
    { zone: "Dishwashing",startTime: "10:00", endTime: "18:00" },
    { zone: "Salad",      startTime: "09:00", endTime: "15:00" },
    { zone: "Fries",      startTime: "11:00", endTime: "21:00" },
    { zone: "Meat",       startTime: "14:00", endTime: "22:00" },
  ]

  let count = 0
  let userIdx = 0
  for (const day of days) {
    for (const s of schedule) {
      const assignee = employees[userIdx % Math.max(employees.length, 1)]
      await saveShift({
        staffId:   assignee?.uid ?? null,
        staffName: assignee?.name ?? assignee?.email ?? null,
        branchId:  branch || "Main Branch",
        zone:      s.zone as any,
        day,
        startTime: s.startTime,
        endTime:   s.endTime,
        isEmergency: false,
        status:    "upcoming",
        weekLabel,
      })
      userIdx++
      count++
    }
  }
  return count
}

async function seedTasks(users: UserProfile[]): Promise<number> {
  const tasks = [
    { title: "Prep vegetables for lunch service", category: "Preparation", priority: "high",   zone: "Kitchen",    timeWindow: "08:00-10:00" },
    { title: "Marinate proteins overnight",       category: "Preparation", priority: "high",   zone: "Meat",       timeWindow: "09:00-10:00" },
    { title: "Set up bar station",                category: "Preparation", priority: "medium", zone: "Bar",        timeWindow: "10:00-11:00" },
    { title: "Prepare salad base",                category: "Preparation", priority: "low",    zone: "Salad",      timeWindow: "09:30-10:30" },
    { title: "Cook lunch specials",               category: "Cooking",     priority: "high",   zone: "Kitchen",    timeWindow: "11:00-13:00" },
    { title: "Grill steaks for dinner service",   category: "Cooking",     priority: "high",   zone: "Grill",      timeWindow: "17:00-21:00" },
    { title: "Prepare fries batches",             category: "Cooking",     priority: "medium", zone: "Fries",      timeWindow: "11:00-22:00" },
    { title: "Serve lunch customers",             category: "Serving",     priority: "high",   zone: "Waiter",     timeWindow: "12:00-15:00" },
    { title: "Greet and seat dinner guests",      category: "Serving",     priority: "high",   zone: "Host",       timeWindow: "17:00-22:00" },
    { title: "Mix cocktails for happy hour",      category: "Serving",     priority: "medium", zone: "Bar",        timeWindow: "17:00-19:00" },
    { title: "Clean kitchen surfaces post-lunch", category: "Cleaning",    priority: "high",   zone: "Kitchen",    timeWindow: "15:00-16:00" },
    { title: "Wash dishes from lunch service",    category: "Cleaning",    priority: "high",   zone: "Dishwashing",timeWindow: "14:00-16:00" },
    { title: "Sanitise bar area at close",        category: "Cleaning",    priority: "medium", zone: "Bar",        timeWindow: "01:00-02:00" },
    { title: "Deep clean grill station",          category: "Cleaning",    priority: "low",    zone: "Grill",      timeWindow: "22:00-23:00" },
    { title: "Check meat stock levels",           category: "Inventory Management", priority: "high",   zone: "Meat",   timeWindow: "08:00-09:00" },
    { title: "Count beverage inventory",          category: "Inventory Management", priority: "medium", zone: "Bar",    timeWindow: "09:00-10:00" },
    { title: "Order vegetables for next week",    category: "Inventory Management", priority: "low",    zone: "Kitchen",timeWindow: "15:00-16:00" },
  ]

  const employees = users.filter((u) => u.role === "EMPLOYEE")
  let idx = 0
  for (const task of tasks) {
    const assignee = employees[idx % Math.max(employees.length, 1)]
    await saveTask({
      ...task as any,
      assignedTo: assignee?.name || assignee?.email || undefined,
    })
    idx++
  }
  return tasks.length
}

async function seedForecast(): Promise<number> {
  const entries = [
    { time: "10:00", predicted: 18,  historical: 15 },
    { time: "11:00", predicted: 42,  historical: 38 },
    { time: "12:00", predicted: 95,  historical: 88 },
    { time: "13:00", predicted: 118, historical: 112 },
    { time: "14:00", predicted: 72,  historical: 68 },
    { time: "15:00", predicted: 35,  historical: 30 },
    { time: "16:00", predicted: 28,  historical: 25 },
    { time: "17:00", predicted: 55,  historical: 50 },
    { time: "18:00", predicted: 98,  historical: 92 },
    { time: "19:00", predicted: 135, historical: 128 },
    { time: "20:00", predicted: 142, historical: 138 },
    { time: "21:00", predicted: 110, historical: 105 },
    { time: "22:00", predicted: 65,  historical: 62 },
  ]
  for (const entry of entries) {
    await saveForecastEntry(todayStr(), entry)
  }
  return entries.length
}

async function seedShortageAlerts(creator: UserProfile): Promise<number> {
  const alerts = [
    {
      zone: "Grill" as const,
      date: todayStr(),
      startTime: "18:00",
      endTime: "23:00",
      reason: "Staff called in sick — short notice",
      priority: "HIGH" as const,
    },
    {
      zone: "Bar" as const,
      date: daysFromNow(1),
      startTime: "20:00",
      endTime: "02:00",
      reason: "Expected high footfall — extra cover needed",
      priority: "NORMAL" as const,
    },
    {
      zone: "Waiter" as const,
      date: daysFromNow(2),
      startTime: "12:00",
      endTime: "16:00",
      reason: "Staff on approved leave",
      priority: "NORMAL" as const,
    },
  ]
  for (const a of alerts) {
    await createShortageAlert({
      createdBy:     creator.uid,
      createdByName: creator.name || creator.email,
      branchId:      creator.branch || "Main Branch",
      branchName:    creator.branch || "Main Branch",
      status: "OPEN",
      ...a,
    })
  }
  return alerts.length
}

async function seedSwapRequests(users: UserProfile[]): Promise<number> {
  const employees = users.filter((u) => u.role === "EMPLOYEE")
  if (employees.length < 2) return 0

  // We need real shift IDs — create two quick shifts first then swap them
  const weekLabel = getWeekLabel()
  const shiftA = await saveShift({
    staffId: employees[0].uid, staffName: employees[0].name || employees[0].email,
    branchId: employees[0].branch || "Main Branch",
    zone: "Kitchen", day: "Saturday", startTime: "10:00", endTime: "18:00",
    isEmergency: false, status: "upcoming", weekLabel,
  })
  const shiftB = await saveShift({
    staffId: employees[1].uid, staffName: employees[1].name || employees[1].email,
    branchId: employees[1].branch || "Main Branch",
    zone: "Bar", day: "Saturday", startTime: "18:00", endTime: "02:00",
    isEmergency: false, status: "upcoming", weekLabel,
  })

  await createSwapRequest({
    requesterId:      employees[0].uid,
    requesterName:    employees[0].name || employees[0].email || "Employee 1",
    requesterShiftId: shiftA,
    targetId:         employees[1].uid,
    targetName:       employees[1].name || employees[1].email || "Employee 2",
    targetShiftId:    shiftB,
    status: "PENDING",
  })
  return 1
}

async function seedTaxiRequests(users: UserProfile[]): Promise<number> {
  const employees = users.filter((u) => u.role === "EMPLOYEE")
  if (employees.length === 0) return 0

  const requests = employees.slice(0, 2).map((u, i) => ({
    staffId:   u.uid,
    staffName: u.name || u.email || "Staff",
    shiftId:   "demo-shift-" + i,
    type:      i === 0 ? "PICKUP" : "DROPOFF" as "PICKUP" | "DROPOFF",
    status:    "PENDING" as const,
    requestTime: new Date().toISOString(),
    branch: u.branch || "Main Branch",
  }))

  for (const r of requests) {
    await addDoc(collection(db, "taxis"), { ...r, createdAt: serverTimestamp() })
  }
  return requests.length
}

async function seedNotifications(users: UserProfile[]): Promise<number> {
  const notifs = [
    { title: "🚨 Staff Shortage — Grill Zone",  body: "Grill zone is short-staffed tonight (18:00–23:00). Please check Shortage Alerts.", type: "shortage" as const },
    { title: "✅ Shift Swap Approved",           body: "Your Saturday Kitchen → Bar swap has been approved by the manager.", type: "swap" as const },
    { title: "📋 New Task Assigned",             body: "You have been assigned: 'Deep clean grill station' due at 22:00.", type: "general" as const },
    { title: "🚖 Transport Request Received",    body: "Taxi pickup request submitted for 08:45 — awaiting manager approval.", type: "taxi" as const },
  ]
  for (const n of notifs) {
    await sendNotification("all", n.title, n.body, n.type)
  }
  return notifs.length
}

// ── Main Component ─────────────────────────────────────────────────────────────
type ModuleKey = "shifts" | "tasks" | "forecast" | "inventory" | "shortage" | "swaps" | "taxi" | "notifications"

interface ModuleStatus {
  status: "idle" | "running" | "done" | "error"
  count?: number
  error?: string
}

const MODULES: { key: ModuleKey; label: string; icon: any; description: string }[] = [
  { key: "shifts",        label: "Shift Schedule",     icon: Calendar,       description: "70 realistic assigned shifts across all 7 days & 10 zones" },
  { key: "tasks",         label: "Task Board",          icon: ClipboardList,  description: "17 tasks across all categories, assigned to employees" },
  { key: "forecast",      label: "Demand Forecast",     icon: TrendingUp,     description: "13 hourly footfall data points for today's chart" },
  { key: "inventory",     label: "Inventory",           icon: Package,        description: "18 items across 7 categories with realistic stock levels" },
  { key: "shortage",      label: "Shortage Alerts",     icon: BellRing,       description: "3 open shortage alerts (1 high priority, 2 normal)" },
  { key: "swaps",         label: "Swap Requests",       icon: ArrowRightLeft, description: "1 pending shift swap between two employees" },
  { key: "taxi",          label: "Taxi Requests",       icon: CarFront,       description: "2 pending transport requests from employees" },
  { key: "notifications", label: "Notifications",       icon: Sparkles,       description: "4 broadcast notifications visible to all users" },
]

export function DemoDataSeeder() {
  const { profile } = useAuth()
  const [running, setRunning]   = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [statuses, setStatuses] = useState<Partial<Record<ModuleKey, ModuleStatus>>>({})

  if (profile?.role !== "ADMIN") return null

  const setStatus = (key: ModuleKey, s: ModuleStatus) =>
    setStatuses((prev) => ({ ...prev, [key]: s }))

  const runAll = async () => {
    setRunning(true)
    setStatuses({})

    let users: UserProfile[] = []
    try {
      users = await getAllUsers()
    } catch {
      toast.error("Failed to fetch users — are you signed in as ADMIN?")
      setRunning(false)
      return
    }

    const branch = profile?.branch || "Main Branch"
    const managerOrAdmin = users.find((u) => u.role === "MANAGER" || u.role === "ADMIN") || profile!

    // Run each module sequentially so errors are isolated
    const run = async (key: ModuleKey, fn: () => Promise<number>) => {
      setStatus(key, { status: "running" })
      try {
        const count = await fn()
        setStatus(key, { status: "done", count })
      } catch (e: any) {
        setStatus(key, { status: "error", error: e.message })
      }
    }

    await run("shifts",        () => seedShifts(users, branch))
    await run("tasks",         () => seedTasks(users))
    await run("forecast",      () => seedForecast())
    await run("inventory",     () => seedInventoryData(branch).then(() => 18))
    await run("shortage",      () => seedShortageAlerts(managerOrAdmin))
    await run("swaps",         () => seedSwapRequests(users))
    await run("taxi",          () => seedTaxiRequests(users))
    await run("notifications", () => seedNotifications(users))

    setRunning(false)
    toast.success("Demo data seeded! Refresh any module to see the data.")
  }

  const allDone = MODULES.every((m) => statuses[m.key]?.status === "done")
  const anyError = MODULES.some((m) => statuses[m.key]?.status === "error")
  const anyRan = Object.keys(statuses).length > 0

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Demo Data Seeder</h3>
            <p className="text-xs text-muted-foreground">
              Populate all modules with realistic data for screenshots & demos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={runAll}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {running
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Seeding…</>
              : allDone
              ? <><CheckCircle className="h-4 w-4" /> Seed Again</>
              : <><Sparkles className="h-4 w-4" /> Seed All Demo Data</>
            }
          </button>
        </div>
      </div>

      {/* Overall result banner */}
      {anyRan && !running && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
          allDone && !anyError
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : anyError
            ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
            : ""
        }`}>
          {allDone && !anyError
            ? <><CheckCircle className="h-4 w-4 shrink-0" /> All modules seeded successfully! Navigate to any section to see live data.</>
            : <><AlertTriangle className="h-4 w-4 shrink-0" /> Some modules failed — check details below.</>
          }
        </div>
      )}

      {/* Module breakdown */}
      {expanded && (
        <div className="grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => {
            const s = statuses[m.key]
            const Icon = m.icon
            return (
              <div
                key={m.key}
                className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                  s?.status === "done"    ? "border-green-500/20 bg-green-500/5" :
                  s?.status === "error"   ? "border-red-500/20 bg-red-500/5" :
                  s?.status === "running" ? "border-primary/30 bg-primary/5" :
                  "border-border bg-card"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  s?.status === "done"    ? "bg-green-500/10 text-green-400" :
                  s?.status === "error"   ? "bg-red-500/10 text-red-400" :
                  s?.status === "running" ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {s?.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                   s?.status === "done"    ? <CheckCircle className="h-4 w-4" /> :
                   s?.status === "error"   ? <AlertTriangle className="h-4 w-4" /> :
                   <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold">{m.label}</p>
                    {s?.status === "done" && s.count !== undefined && (
                      <span className="text-[10px] font-bold text-green-400">+{s.count}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                    {s?.status === "error" ? (
                      <span className="text-red-400">{s.error}</span>
                    ) : m.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!expanded && (
        <p className="text-xs text-muted-foreground">
          Seeds shifts, tasks, forecast chart, inventory, shortage alerts, swap requests, taxi requests and notifications using your existing registered users.{" "}
          <button onClick={() => setExpanded(true)} className="text-primary hover:underline">
            View details →
          </button>
        </p>
      )}
    </div>
  )
}
