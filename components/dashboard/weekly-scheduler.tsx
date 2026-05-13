"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Shift } from "@/lib/types"
import { weekDays } from "@/lib/mock-data"
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Clock, Plus, X, Trash2, RefreshCw, Edit } from "lucide-react"
import { subscribeToShifts, saveShift, deleteShift, updateShift as _updateShift, sendNotification, notifyShiftChange } from "@/lib/services/data-service"
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
      const shiftId = await saveShift({
        staffId,
        staffName: selectedStaff?.name || selectedStaff?.email || "Unknown",
        branchId: selectedStaff?.branch || "main",
        zone, day, startTime, endTime,
        isEmergency: false,
        status: "upcoming",
        weekLabel,
      })
      // Notify the assigned employee
      if (staffId) {
        const newShift = {
          id: shiftId,
          staffId,
          staffName: selectedStaff?.name || selectedStaff?.email || "Unknown",
          branchId: selectedStaff?.branch || "main",
          zone, 
          day, 
          startTime, 
          endTime,
          isEmergency: false,
          status: "upcoming" as const,
          weekLabel,
        }
        await notifyShiftChange(staffId, newShift, "assigned")
      }
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

// ── Edit Shift Modal ──────────────────────────────────────────────────────────
function EditShiftModal({
  shift, staff, onClose, onSaved,
}: {
  shift: Shift; staff: UserProfile[]
  onClose: () => void; onSaved: () => void
}) {
  const [staffId, setStaffId]   = useState(shift.staffId || "")
  const [zone, setZone]         = useState(shift.zone)
  const [startTime, setStart]   = useState(shift.startTime)
  const [endTime, setEnd]       = useState(shift.endTime)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")

  const selectedStaff = staff.find((s) => s.uid === staffId)

  const handleSave = async () => {
    if (!staffId || !zone || !startTime || !endTime) {
      setError("Fill in all fields."); return
    }
    setSaving(true); setError("")
    try {
      // Detect what changed
      const staffChanged = staffId !== shift.staffId
      const timeChanged = startTime !== shift.startTime || endTime !== shift.endTime
      
      // Update the shift
      await _updateShift(shift.id, {
        staffId,
        staffName: selectedStaff?.name || selectedStaff?.email || "Unknown",
        zone,
        startTime,
        endTime,
      })
      
      // Send notifications based on what changed
      if (staffChanged) {
        // Notify old staff member if they were assigned
        if (shift.staffId) {
          await notifyShiftChange(shift.staffId, shift, "removed")
        }
        // Notify new staff member
        if (staffId) {
          const updatedShift = { ...shift, staffId, zone, startTime, endTime }
          await notifyShiftChange(staffId, updatedShift, "assigned")
        }
      } else if (timeChanged && staffId) {
        // Same staff, but time changed
        const updatedShift = { ...shift, zone, startTime, endTime }
        await notifyShiftChange(staffId, updatedShift, "modified")
      }
      
      onSaved()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Edit Shift — {shift.day}</h3>
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shift Card ────────────────────────────────────────────────────────────────
function ShiftCard({ shift, canEdit, onDelete, onMarkUnavailable, onEdit }: {
  shift: Shift; canEdit: boolean
  onDelete: (id: string) => void
  onMarkUnavailable: (shift: Shift) => void
  onEdit: (shift: Shift) => void
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
            <>
              <button
                onClick={() => onEdit(shift)}
                title="Edit shift"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/20 text-primary"
              >
                <Edit className="h-3 w-3" />
              </button>
              <button
                onClick={() => onMarkUnavailable(shift)}
                title="Mark worker unavailable"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-warning/20 text-warning-foreground"
              >
                <AlertTriangle className="h-3 w-3" />
              </button>
              <button onClick={() => onDelete(shift.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/20 text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </>
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
  const [allShifts, setAllShifts]   = useState<Shift[]>([])
  const [staff, setStaff]           = useState<UserProfile[]>([])
  const [isOptimizing, setOptimizing] = useState(false)
  const [addingDay, setAddingDay]   = useState<string | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [weekLabel]                 = useState(getWeekLabel())
  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"
  const isAdmin = profile?.role === "ADMIN"
  const myBranch = profile?.branch ?? ""

  // Real-time shifts subscription — filter by branch for MANAGER
  useEffect(() => {
    const unsub = subscribeToShifts(weekLabel, (fetched) => {
      // ADMIN sees all; MANAGER sees own branch only
      const scoped = isAdmin ? fetched : fetched.filter((s) => s.branchId === myBranch)
      setAllShifts(scoped)
    })
    return () => unsub()
  }, [weekLabel, isAdmin, myBranch])

  // Load staff for the add-shift modal
  useEffect(() => {
    if (isManagerOrAdmin) getAllUsers().then(setStaff)
  }, [isManagerOrAdmin])

  const handleDelete = async (id: string) => {
    await deleteShift(id)
  }

  const handleMarkUnavailable = async (shift: Shift) => {
    // Store the original staffId before marking as vacant
    const originalStaffId = shift.staffId
    
    // Mark shift as vacant
    await _updateShift(shift.id, { status: "vacant", staffId: null, staffName: null })
    
    // Notify the worker being removed from the shift
    if (originalStaffId) {
      await notifyShiftChange(originalStaffId, shift, "removed")
    }
    
    // Calculate remaining time and create shortage alert
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const { createShortageAlert } = await import("@/lib/services/user-service")
    await createShortageAlert({
      createdBy: profile?.uid ?? "system",
      createdByName: profile?.name || profile?.email || "Manager",
      branchId: shift.branchId || "main",
      branchName: shift.branchId || "Main Branch",
      zone: shift.zone as any,
      date: shift.day,
      startTime: currentTime, // remaining shift starts now
      endTime: shift.endTime,
      reason: `Worker marked unavailable — ${shift.staffName || "Unknown"}`,
      priority: "HIGH",
      status: "OPEN",
    })
    // Broadcast notification to all
    await sendNotification("all", "🚨 Emergency Vacancy", `${shift.zone} zone needs coverage from ${currentTime} to ${shift.endTime} on ${shift.day}.`, "shortage")
  }

  const handleOptimize = async () => {
    if (allShifts.length === 0) return
    setOptimizing(true)
    try {
      const optimized = await optimizeSchedule(allShifts, staff as any)
      // Batch update statuses in Firestore
      await Promise.all(
        allShifts.map((s) => {
          const updated = optimized.find((o) => o.id === s.id)
          return updated && updated.status !== s.status
            ? _updateShift(s.id, { status: updated.status })
            : Promise.resolve()
        })
      )
    } catch {
      await Promise.all(allShifts.map((s) => _updateShift(s.id, { status: "optimal" })))
    } finally {
      setOptimizing(false)
    }
  }

  const shiftsByDay = weekDays.reduce((acc, day) => {
    acc[day] = allShifts.filter((s) => s.day === day)
    return acc
  }, {} as Record<string, Shift[]>)

  const statusCounts = {
    vacant:       allShifts.filter((s) => s.status === "vacant").length,
    optimal:      allShifts.filter((s) => s.status === "optimal").length,
    upcoming:     allShifts.filter((s) => s.status === "upcoming").length,
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Week of {weekLabel} · {allShifts.length} shifts{!isAdmin && myBranch ? ` · ${myBranch}` : ""}</CardDescription>
            </div>
            <div className="flex gap-2">
              {isManagerOrAdmin && (
                <Button onClick={handleOptimize} disabled={isOptimizing || allShifts.length === 0}
                  className="gap-2 bg-primary hover:bg-primary/90">
                  {isOptimizing
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Optimizing…</>
                    : <><Sparkles className="h-4 w-4" />Optimize with Groq</>}
                </Button>
              )}
            </div>
          </div>
          {allShifts.length > 0 && (
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
                          onDelete={handleDelete}
                          onMarkUnavailable={handleMarkUnavailable}
                          onEdit={setEditingShift} />
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

      {editingShift && (
        <EditShiftModal
          shift={editingShift}
          staff={staff}
          onClose={() => setEditingShift(null)}
          onSaved={() => setEditingShift(null)}
        />
      )}
    </>
  )
}

// Groq optimize helper
async function updateShift(id: string, data: Partial<Shift>) {
  return _updateShift(id, data)
}
