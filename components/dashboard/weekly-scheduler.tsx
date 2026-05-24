"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Shift } from "@/lib/types"
import { weekDays } from "@/lib/mock-data"
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Clock, Plus, X, Trash2, RefreshCw, Edit, ChevronDown, Calendar, Check } from "lucide-react"
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
  day, weekLabel, staff, managerBranch, onClose, onSaved,
}: {
  day: string; weekLabel: string; staff: UserProfile[]
  managerBranch: string
  onClose: () => void; onSaved: () => void
}) {
  const [staffId, setStaffId]   = useState("")
  const [zone, setZone]         = useState("Kitchen")
  const [startTime, setStart]   = useState("09:00")
  const [endTime, setEnd]       = useState("17:00")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false)
  const [zoneDropdownOpen, setZoneDropdownOpen]   = useState(false)

  const selectedStaff = staff.find((s) => s.uid === staffId)

  const handleSave = async () => {
    if (!staffId || !zone || !startTime || !endTime) {
      setError("Fill in all fields."); return
    }
    setSaving(true); setError("")
    try {
      const shiftBranchId = managerBranch || selectedStaff?.branch || "main"
      const shiftId = await saveShift({
        staffId,
        staffName: selectedStaff?.name || selectedStaff?.email || "Unknown",
        branchId: shiftBranchId,
        zone, day, startTime, endTime,
        isEmergency: false,
        status: "upcoming",
        weekLabel,
      })
      if (staffId) {
        const newShift = {
          id: shiftId,
          staffId,
          staffName: selectedStaff?.name || selectedStaff?.email || "Unknown",
          branchId: shiftBranchId,
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

  const toggleStaffDropdown = () => {
    setStaffDropdownOpen(!staffDropdownOpen)
    setZoneDropdownOpen(false)
  }

  const toggleZoneDropdown = () => {
    setZoneDropdownOpen(!zoneDropdownOpen)
    setStaffDropdownOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Transparent overlay to catch click-aways without double darkening */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      <div className="relative bg-card border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] w-full max-w-sm max-h-[90vh] overflow-y-visible p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Top subtle brand gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-violet-600 rounded-t-2xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Add Shift</h3>
            <p className="text-xs text-muted-foreground">{day} Schedule</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Staff picker (Custom Dropdown) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff Member</label>
            <button
              type="button"
              onClick={toggleStaffDropdown}
              className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
            >
              {selectedStaff ? (
                <span className="text-foreground font-semibold">
                  {selectedStaff.name || selectedStaff.email} <span className="text-xs font-normal text-muted-foreground">({selectedStaff.role})</span>
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Select staff…</span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${staffDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {staffDropdownOpen && (
              <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                {staff.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                    No staff available
                  </div>
                ) : (
                  staff.map((s) => (
                    <button
                      key={s.uid}
                      type="button"
                      onClick={() => {
                        setStaffId(s.uid)
                        setStaffDropdownOpen(false)
                      }}
                      className={`flex flex-col w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${staffId === s.uid ? 'bg-primary/5 hover:bg-primary/10 font-bold' : ''}`}
                    >
                      <span className="font-bold text-foreground">{s.name || s.email}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 uppercase font-medium">{s.role}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Zone (Custom Dropdown) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone</label>
            <button
              type="button"
              onClick={toggleZoneDropdown}
              className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
            >
              <span className="text-foreground font-semibold">{zone}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${zoneDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {zoneDropdownOpen && (
              <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                {ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setZone(z)
                      setZoneDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${zone === z ? 'bg-primary/5 hover:bg-primary/10 font-bold' : ''}`}
                  >
                    <span className="text-foreground font-semibold">{z}</span>
                    {zone === z && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStart(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End</label>
              <input type="time" value={endTime} onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/95 transition-all shadow-md cursor-pointer">
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
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false)
  const [zoneDropdownOpen, setZoneDropdownOpen]   = useState(false)

  const selectedStaff = staff.find((s) => s.uid === staffId)

  const handleSave = async () => {
    if (!staffId || !zone || !startTime || !endTime) {
      setError("Fill in all fields."); return
    }
    setSaving(true); setError("")
    try {
      const staffChanged = staffId !== shift.staffId
      const timeChanged = startTime !== shift.startTime || endTime !== shift.endTime
      
      await _updateShift(shift.id, {
        staffId,
        staffName: selectedStaff?.name || selectedStaff?.email || "Unknown",
        zone,
        startTime,
        endTime,
      })
      
      if (staffChanged) {
        if (shift.staffId) {
          await notifyShiftChange(shift.staffId, shift, "removed")
        }
        if (staffId) {
          const updatedShift = { ...shift, staffId, zone, startTime, endTime }
          await notifyShiftChange(staffId, updatedShift, "assigned")
        }
      } else if (timeChanged && staffId) {
        const updatedShift = { ...shift, zone, startTime, endTime }
        await notifyShiftChange(staffId, updatedShift, "modified")
      }
      
      onSaved()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const toggleStaffDropdown = () => {
    setStaffDropdownOpen(!staffDropdownOpen)
    setZoneDropdownOpen(false)
  }

  const toggleZoneDropdown = () => {
    setZoneDropdownOpen(!zoneDropdownOpen)
    setStaffDropdownOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Transparent overlay to catch click-aways without double darkening */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      <div className="relative bg-card border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] w-full max-w-sm max-h-[90vh] overflow-y-visible p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Top subtle brand gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-violet-600 rounded-t-2xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Edit Shift</h3>
            <p className="text-xs text-muted-foreground">{shift.day} Schedule</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Staff picker (Custom Dropdown) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff Member</label>
            <button
              type="button"
              onClick={toggleStaffDropdown}
              className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
            >
              {selectedStaff ? (
                <span className="text-foreground font-semibold">
                  {selectedStaff.name || selectedStaff.email} <span className="text-xs font-normal text-muted-foreground">({selectedStaff.role})</span>
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Select staff…</span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${staffDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {staffDropdownOpen && (
              <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                {staff.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                    No staff available
                  </div>
                ) : (
                  staff.map((s) => (
                    <button
                      key={s.uid}
                      type="button"
                      onClick={() => {
                        setStaffId(s.uid)
                        setStaffDropdownOpen(false)
                      }}
                      className={`flex flex-col w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${staffId === s.uid ? 'bg-primary/5 hover:bg-primary/10 font-bold' : ''}`}
                    >
                      <span className="font-bold text-foreground">{s.name || s.email}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 uppercase font-medium">{s.role}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Zone (Custom Dropdown) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone</label>
            <button
              type="button"
              onClick={toggleZoneDropdown}
              className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
            >
              <span className="text-foreground font-semibold">{zone}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${zoneDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {zoneDropdownOpen && (
              <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                {ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setZone(z)
                      setZoneDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${zone === z ? 'bg-primary/5 hover:bg-primary/10 font-bold' : ''}`}
                  >
                    <span className="text-foreground font-semibold">{z}</span>
                    {zone === z && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStart(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End</label>
              <input type="time" value={endTime} onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/95 transition-all shadow-md cursor-pointer">
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
      // ADMIN sees all shifts.
      // MANAGER with a branch set sees only their branch.
      // MANAGER with no branch set (myBranch is "") sees all shifts —
      //   the empty-string filter would hide every saved shift otherwise.
      const scoped =
        isAdmin || !myBranch
          ? fetched
          : fetched.filter((s) => s.branchId === myBranch)
      setAllShifts(scoped)
    })
    return () => unsub()
  }, [weekLabel, isAdmin, myBranch])

  const [error, setError]           = useState("")

  // Load staff for the add-shift modal
  useEffect(() => {
    if (isManagerOrAdmin) getAllUsers().then(setStaff)
  }, [isManagerOrAdmin])

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Are you sure you want to delete this shift?")
    if (!ok) return
    setError("")
    try {
      await deleteShift(id)
    } catch (err: any) {
      setError(err.message || "Failed to delete shift.")
      alert(err.message || "Failed to delete shift.")
    }
  }

  const handleMarkUnavailable = async (shift: Shift) => {
    setError("")
    try {
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
    } catch (err: any) {
      setError(err.message || "Failed to mark worker unavailable.")
      alert(err.message || "Failed to mark worker unavailable.")
    }
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
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
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
          managerBranch={myBranch}
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
