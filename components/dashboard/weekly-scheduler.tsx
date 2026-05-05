"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Shift } from "@/lib/types"
import { weekDays } from "@/lib/mock-data"
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Clock, Plus, X, Trash2, RefreshCw } from "lucide-react"
import { subscribeToShifts, saveShift, deleteShift } from "@/lib/services/data-service"
import { getAllUsers, type UserProfile } from "@/lib/services/user-service"
import { useAuth } from "@/components/providers/auth-provider"
import { optimizeSchedule } from "@/lib/services/groq-service"

const ZONES = ["Meat", "Salad", "Grill", "Fries", "Dishwashing", "Bar", "Waiter", "Kitchen", "Host"]

const statusConfig: Record<string, { color: string; badge: string; icon: any; label: string }> = {
  understaffed: { color: "bg-destructive/10 border-destructive/30 text-destructive", badge: "bg-destructive text-destructive-foreground", icon: AlertTriangle, label: "Understaffed" },
  optimal:      { color: "bg-success/10 border-success/30 text-success",             badge: "bg-success text-success-foreground",             icon: CheckCircle,  label: "Optimal" },
  overworked:   { color: "bg-warning/10 border-warning/30 text-warning-foreground",  badge: "bg-warning text-warning-foreground",             icon: Clock,        label: "Overworked" },
  upcoming:     { color: "bg-primary/10 border-primary/30 text-primary",             badge: "bg-primary text-primary-foreground",             icon: Clock,        label: "Upcoming" },
  vacant:       { color: "bg-muted border-dashed border-muted-foreground/30",        badge: "bg-muted text-muted-foreground",                 icon: AlertTriangle,label: "Vacant" },
}

function getWeekLabel() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return monday.toISOString().split("T")[0]
}

// ── Add Shift Modal ───────────────────────────────────────────────────────────
function AddShiftModal({
  day, weekLabel, staff, onClose, onSaved,
}: {
  day: string; weekLabel: string; staff: UserProfile[]
  onClose: () => void; onSaved: () => void
}) {
  const [staffId, setStaffId]   = useState("")
  const [zone, setZone]         = useState("Kitchen")
  const [startTime, setStart]   = useState("09:00")
  const [endTime, setEnd]       = useState("17:00")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")

  const selectedStaff = staff.find((s) => s.uid === staffId)

  const handleSave = async () => {
    if (!staffId || !zone || !startTime || !endTime) {
      setError("Fill in all fields."); return
    }
    setSaving(true); setError("")
    try {
      await saveShift({
        staffId,
        staffName: selectedStaff?.name || selectedStaff?.email || "Unknown",
        branchId: selectedStaff?.branch || "main",
        zone, day, startTime, endTime,
        isEmergency: false,
        status: "upcoming",
        weekLabel,
      })
      onSaved()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Add Shift — {day}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          {/* Staff picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff Member</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Select staff…</option>
              {staff.map((s) => (
                <option key={s.uid} value={s.uid}>{s.name || s.email} ({s.role})</option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone</label>
            <select value={zone} onChange={(e) => setZone(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStart(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End</label>
              <input type="time" value={endTime} onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/90 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Shift
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shift Card ────────────────────────────────────────────────────────────────
function ShiftCard({ shift, canEdit, onDelete }: {
  shift: Shift; canEdit: boolean; onDelete: (id: string) => void
}) {
  const cfg = statusConfig[shift.status] ?? statusConfig.upcoming
  const Icon = cfg.icon

  return (
    <div className={cn("rounded-lg border p-2 transition-all hover:shadow-md group relative", cfg.color)}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{shift.staffName}</p>
          <p className="text-xs text-muted-foreground">{shift.zone}</p>
        </div>
        <div className="flex items-center gap-1">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {canEdit && (
            <button onClick={() => onDelete(shift.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/20 text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        {shift.startTime} – {shift.endTime}
      </p>
    </div>
  )
}

// ── Main Scheduler ────────────────────────────────────────────────────────────
export function WeeklyScheduler() {
  const { profile } = useAuth()
  const [shifts, setShifts]         = useState<Shift[]>([])
  const [staff, setStaff]           = useState<UserProfile[]>([])
  const [isOptimizing, setOptimizing] = useState(false)
  const [addingDay, setAddingDay]   = useState<string | null>(null)
  const [weekLabel]                 = useState(getWeekLabel())
  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"

  // Real-time shifts subscription
  useEffect(() => {
    const unsub = subscribeToShifts(weekLabel, setShifts)
    return () => unsub()
  }, [weekLabel])

  // Load staff for the add-shift modal
  useEffect(() => {
    if (isManagerOrAdmin) getAllUsers().then(setStaff)
  }, [isManagerOrAdmin])

  const handleDelete = async (id: string) => {
    await deleteShift(id)
  }

  const handleOptimize = async () => {
    if (shifts.length === 0) return
    setOptimizing(true)
    try {
      const optimized = await optimizeSchedule(shifts, staff as any)
      // Batch update statuses in Firestore
      await Promise.all(
        shifts.map((s) => {
          const updated = optimized.find((o) => o.id === s.id)
          return updated && updated.status !== s.status
            ? updateShift(s.id, { status: updated.status })
            : Promise.resolve()
        })
      )
    } catch {
      // fallback: mark all optimal
      await Promise.all(shifts.map((s) => updateShift(s.id, { status: "optimal" })))
    } finally {
      setOptimizing(false)
    }
  }

  const shiftsByDay = weekDays.reduce((acc, day) => {
    acc[day] = shifts.filter((s) => s.day === day)
    return acc
  }, {} as Record<string, Shift[]>)

  const statusCounts = {
    understaffed: shifts.filter((s) => s.status === "understaffed").length,
    optimal:      shifts.filter((s) => s.status === "optimal").length,
    overworked:   shifts.filter((s) => s.status === "overworked").length,
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Week of {weekLabel} · {shifts.length} shifts</CardDescription>
            </div>
            <div className="flex gap-2">
              {isManagerOrAdmin && (
                <Button onClick={handleOptimize} disabled={isOptimizing || shifts.length === 0}
                  className="gap-2 bg-primary hover:bg-primary/90">
                  {isOptimizing
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Optimizing…</>
                    : <><Sparkles className="h-4 w-4" />Optimize with Groq</>}
                </Button>
              )}
            </div>
          </div>
          {shifts.length > 0 && (
            <div className="flex gap-3 pt-2 flex-wrap">
              {Object.entries(statusCounts).map(([status, count]) => {
                const cfg = statusConfig[status]
                if (!cfg || count === 0) return null
                return (
                  <Badge key={status} className={cn("gap-1", cfg.badge)}>
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}: {count}
                  </Badge>
                )
              })}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day} className="flex flex-col min-w-0">
                <div className="mb-2 rounded-md bg-muted px-2 py-1.5 text-center text-sm font-semibold">
                  {day.slice(0, 3)}
                </div>
                <div className="flex-1 space-y-2">
                  {shiftsByDay[day].length > 0
                    ? shiftsByDay[day].map((shift) => (
                        <ShiftCard key={shift.id} shift={shift}
                          canEdit={isManagerOrAdmin}
                          onDelete={handleDelete} />
                      ))
                    : (
                      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center text-xs text-muted-foreground">
                        No shifts
                      </div>
                    )}
                  {/* Add shift button — managers only */}
                  {isManagerOrAdmin && (
                    <button onClick={() => setAddingDay(day)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-primary/30 text-primary/60 hover:border-primary hover:text-primary text-xs transition-colors">
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {addingDay && (
        <AddShiftModal
          day={addingDay}
          weekLabel={weekLabel}
          staff={staff}
          onClose={() => setAddingDay(null)}
          onSaved={() => setAddingDay(null)}
        />
      )}
    </>
  )
}

// helper used inside handleOptimize
async function updateShift(id: string, data: Partial<Shift>) {
  const { updateShift: _update } = await import("@/lib/services/data-service")
  return _update(id, data)
}
