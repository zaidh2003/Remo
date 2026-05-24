"use client"

import { useEffect, useState } from "react"
import {
  RefreshCw, Loader2, CheckCircle2, XCircle, Clock, MapPin, User, ArrowRightLeft, Plus, X, Check, ChevronDown, Calendar
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import {
  getSwapRequests, approveSwapRequest, rejectSwapRequest, createSwapRequest
} from "@/lib/services/data-service"
import { getShifts } from "@/lib/services/data-service"
import type { SwapRequest, Shift } from "@/lib/types"
import { getAllUsers, type UserProfile } from "@/lib/services/user-service"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  APPROVED_BY_TARGET: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  APPROVED_BY_MANAGER: "bg-green-500/15 text-green-400 border-green-500/30",
  REJECTED: "bg-muted text-muted-foreground border-border",
}

// ── Create Swap Request Modal (Employee) ───────────────────────────────────────
function CreateSwapModal({
  myShifts,
  allShifts,
  allStaff,
  currentUser,
  onClose,
  onCreated,
}: {
  myShifts: Shift[]
  allShifts: Shift[]
  allStaff: UserProfile[]
  currentUser: { uid: string; name?: string; email?: string }
  onClose: () => void
  onCreated: () => void
}) {
  const [myShiftId, setMyShiftId]     = useState("")
  const [targetShiftId, setTargetId]  = useState("")
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState("")
  const [myDropdownOpen, setMyDropdownOpen] = useState(false)
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false)

  // Other people's shifts (not mine)
  const otherShifts = allShifts.filter((s) => s.staffId && s.staffId !== currentUser.uid)

  const selectedMyShift = myShifts.find((s) => s.id === myShiftId)
  const selectedTargetShift = otherShifts.find((s) => s.id === targetShiftId)
  const targetStaff = selectedTargetShift ? allStaff.find((u) => u.uid === selectedTargetShift.staffId) : null

  const handleCreate = async () => {
    if (!myShiftId || !targetShiftId) {
      setError("Please select both shifts."); return
    }
    const targetShift = allShifts.find((s) => s.id === targetShiftId)
    if (!targetShift?.staffId) {
      setError("Target shift has no assigned staff."); return
    }
    const targetStaffProfile = allStaff.find((u) => u.uid === targetShift.staffId)
    setSaving(true); setError("")
    try {
      await createSwapRequest({
        requesterId:     currentUser.uid,
        requesterName:   currentUser.name || currentUser.email || "Unknown",
        requesterShiftId: myShiftId,
        targetId:        targetShift.staffId,
        targetName:      targetStaffProfile?.name || targetStaffProfile?.email || "Unknown",
        targetShiftId,
        status: "PENDING",
      })
      toast.success("Swap request submitted!")
      onCreated()
    } catch (e: any) {
      setError(e.message || "Failed to submit request.")
      toast.error("Failed to submit swap request")
    } finally {
      setSaving(false)
    }
  }

  const toggleMyDropdown = () => {
    setMyDropdownOpen(!myDropdownOpen)
    setTargetDropdownOpen(false)
  }

  const toggleTargetDropdown = () => {
    setTargetDropdownOpen(!targetDropdownOpen)
    setMyDropdownOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <div className="relative bg-card border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] w-full max-w-md max-h-[95vh] overflow-y-visible p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Top subtle brand gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-violet-500 to-indigo-500 rounded-t-2xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/15">
              <ArrowRightLeft className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-foreground tracking-tight">Request Shift Swap</h3>
              <p className="text-xs text-muted-foreground">Propose a shift trade with a colleague</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Swap Arena (Visual Trade Preview) */}
        <div className="bg-muted/20 border border-border/60 rounded-2xl p-4.5 flex items-center justify-between gap-3 relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-indigo-500/5 opacity-55 pointer-events-none" />
          
          {/* Left: Your Shift Card */}
          <div className="flex-1 z-10">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">Your Shift</p>
            {selectedMyShift ? (
              <div className="bg-card border border-border/80 rounded-xl p-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                <p className="font-extrabold text-sm text-foreground truncate">{selectedMyShift.zone}</p>
                <div className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex items-center gap-1 font-medium text-primary">
                    <Calendar className="h-3 w-3 shrink-0" /> {selectedMyShift.day}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" /> {selectedMyShift.startTime}–{selectedMyShift.endTime}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/60 rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[82px] bg-background/30 hover:bg-background/50 hover:border-primary/45 transition-all">
                <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center mb-1 text-muted-foreground/60">
                  <User className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold">Select shift</p>
              </div>
            )}
          </div>

          {/* Middle: Swap Indicator */}
          <div className="flex flex-col items-center justify-center shrink-0 z-10">
            <div className="w-9.5 h-9.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-md animate-pulse">
              <ArrowRightLeft className="h-4.5 w-4.5" />
            </div>
            <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest mt-1.5">SWAP</span>
          </div>

          {/* Right: Colleague's Shift Card */}
          <div className="flex-1 z-10">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 text-center">Their Shift</p>
            {selectedTargetShift ? (
              <div className="bg-card border border-border/80 rounded-xl p-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
                <p className="font-extrabold text-sm text-foreground truncate">{selectedTargetShift.zone}</p>
                <div className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex items-center gap-1 font-medium text-indigo-400">
                    <Calendar className="h-3 w-3 shrink-0" /> {selectedTargetShift.day}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" /> {selectedTargetShift.startTime}–{selectedTargetShift.endTime}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-foreground font-semibold truncate pt-1 border-t border-border/40 mt-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[7px] font-black shrink-0">
                      {targetStaff?.name ? targetStaff.name.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <span className="truncate">{targetStaff?.name || "Unknown"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/60 rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[82px] bg-background/30 hover:bg-background/50 hover:border-indigo-500/35 transition-all">
                <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center mb-1 text-muted-foreground/60">
                  <User className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold">Select shift</p>
              </div>
            )}
          </div>
        </div>

        {/* Input Forms */}
        <div className="space-y-4">
          {/* My shift to give away (Custom Select) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              My Shift (giving away)
            </label>
            
            <button
              type="button"
              onClick={toggleMyDropdown}
              className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-4 py-3 text-sm outline-none transition-all text-left font-medium shadow-sm hover:shadow-md cursor-pointer"
            >
              {selectedMyShift ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary">
                    {selectedMyShift.day.slice(0, 3)}
                  </span>
                  <span className="text-foreground font-semibold">{selectedMyShift.zone}</span>
                  <span className="text-muted-foreground text-xs">({selectedMyShift.startTime}–{selectedMyShift.endTime})</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select your shift…</span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${myDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {myDropdownOpen && (
              <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                {myShifts.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                    No shifts scheduled for you
                  </div>
                ) : (
                  myShifts.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setMyShiftId(s.id)
                        setMyDropdownOpen(false)
                      }}
                      className={`flex flex-col w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${myShiftId === s.id ? 'bg-primary/5 hover:bg-primary/10 font-bold' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-foreground">{s.zone}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {s.day}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.startTime} – {s.endTime}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Target shift to receive (Custom Select) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Swap With (colleague's shift)
            </label>
            
            <button
              type="button"
              onClick={toggleTargetDropdown}
              className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-4 py-3 text-sm outline-none transition-all text-left font-medium shadow-sm hover:shadow-md cursor-pointer"
            >
              {selectedTargetShift ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400">
                    {selectedTargetShift.day.slice(0, 3)}
                  </span>
                  <span className="text-foreground font-semibold">{selectedTargetShift.zone}</span>
                  <span className="text-muted-foreground text-xs">({targetStaff?.name || "Colleague"})</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select colleague's shift…</span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${targetDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {targetDropdownOpen && (
              <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                {otherShifts.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                    No colleague shifts available
                  </div>
                ) : (
                  otherShifts.map((s) => {
                    const staff = allStaff.find((u) => u.uid === s.staffId)
                    const isSelected = targetShiftId === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setTargetId(s.id)
                          setTargetDropdownOpen(false)
                        }}
                        className={`flex flex-col w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${isSelected ? 'bg-primary/5 hover:bg-primary/10 font-bold' : ''}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-foreground">{s.zone}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                            {s.day}
                          </span>
                        </div>
                        <div className="flex items-center justify-between w-full mt-1.5">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {s.startTime} – {s.endTime}
                          </div>
                          <div className="text-xs font-bold text-foreground flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            {staff?.name || "Unknown"}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl animate-in fade-in slide-in-from-bottom-1 duration-150">
            {error}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-all cursor-pointer hover:shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/95 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Swap Request Card ─────────────────────────────────────────────────────────
function SwapRequestCard({ 
  swapRequest, 
  requesterShift, 
  targetShift,
  isManagerOrAdmin,
  currentUserId,
  onAction 
}: {
  swapRequest: SwapRequest
  requesterShift: Shift | null
  targetShift: Shift | null
  isManagerOrAdmin: boolean
  currentUserId: string
  onAction: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleApprove = async () => {
    setLoading(true); setError("")
    try {
      await approveSwapRequest(swapRequest.id)
      toast.success("Swap approved!")
      onAction()
    } catch (e: any) {
      setError("Failed to approve: " + e.message)
      toast.error("Failed to approve swap")
    } finally { setLoading(false) }
  }

  const handleReject = async () => {
    setLoading(true); setError("")
    try {
      await rejectSwapRequest(swapRequest.id)
      toast.success("Swap rejected.")
      onAction()
    } catch (e: any) {
      setError("Failed to reject: " + e.message)
    } finally { setLoading(false) }
  }

  const handleCancel = async () => {
    const ok = window.confirm("Are you sure you want to cancel this swap request?")
    if (!ok) return
    setLoading(true); setError("")
    try {
      const { deleteDoc, doc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      await deleteDoc(doc(db, "swapRequests", swapRequest.id))
      toast.success("Swap request cancelled.")
      onAction()
    } catch (e: any) {
      setError("Failed to cancel swap request: " + e.message)
      toast.error("Failed to cancel swap request")
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Header with status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/20 text-blue-500">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">Shift Swap Request</p>
            <p className="text-xs text-muted-foreground">
              {swapRequest.requesterName} ↔ {swapRequest.targetName}
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[swapRequest.status]}`}>
          {swapRequest.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Shift Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-background/50 border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            {swapRequest.requesterName} (giving away)
          </div>
          {requesterShift ? (
            <div className="space-y-1">
              <p className="font-bold text-lg">{requesterShift.zone}</p>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{requesterShift.day}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{requesterShift.startTime} – {requesterShift.endTime}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Shift not found</p>
          )}
        </div>

        <div className="bg-background/50 border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            {swapRequest.targetName} (receiving)
          </div>
          {targetShift ? (
            <div className="space-y-1">
              <p className="font-bold text-lg">{targetShift.zone}</p>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{targetShift.day}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{targetShift.startTime} – {targetShift.endTime}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Shift not found</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Approve/Reject — managers/admins only */}
      {isManagerOrAdmin && swapRequest.status === "PENDING" && (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl text-sm disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve Swap
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 rounded-xl text-sm disabled:opacity-60 transition-colors"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
        </div>
      )}

      {/* Cancel swap request — requester employee only & status is PENDING */}
      {!isManagerOrAdmin && swapRequest.requesterId === currentUserId && swapRequest.status === "PENDING" && (
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground font-semibold py-2 rounded-xl text-sm disabled:opacity-60 hover:bg-destructive/90 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancel Swap Request
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SwapRequests() {
  const { profile } = useAuth()
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [shifts, setShifts]             = useState<Shift[]>([])
  const [allStaff, setAllStaff]         = useState<UserProfile[]>([])
  const [loading, setLoading]           = useState(true)
  const [showCreate, setShowCreate]     = useState(false)

  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"
  const isEmployee       = profile?.role === "EMPLOYEE"

  const loadShifts = async () => {
    try {
      const [allShifts, users] = await Promise.all([getShifts(), getAllUsers()])
      setShifts(allShifts)
      setAllStaff(users)
    } catch (e) {
      console.error("Failed to load shifts:", e)
    }
  }

  useEffect(() => {
    if (!profile) return
    loadShifts()
    const unsubscribe = getSwapRequests((requests) => {
      setSwapRequests(requests)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [profile])

  const handleRefresh = () => { setLoading(true); loadShifts() }

  if (!profile) return null

  const findShift = (shiftId: string) => shifts.find((s) => s.id === shiftId) || null
  const myShifts  = shifts.filter((s) => s.staffId === profile.uid)

  // Employees only see their own swap requests
  const visibleRequests = isManagerOrAdmin
    ? swapRequests
    : swapRequests.filter((r) => r.requesterId === profile.uid || r.targetId === profile.uid)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Swap Requests</h2>
          <p className="text-sm text-muted-foreground">
            {isManagerOrAdmin
              ? "Review and approve shift swap requests from employees"
              : "Request a shift swap or view your pending requests"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Employee: Create Swap button */}
          {isEmployee && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Request Swap
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visibleRequests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 opacity-30" />
          {isEmployee
            ? "You have no swap requests. Click \"Request Swap\" to start one."
            : "No swap requests at the moment."}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRequests.map((request) => (
            <SwapRequestCard
              key={request.id}
              swapRequest={request}
              requesterShift={findShift(request.requesterShiftId)}
              targetShift={findShift(request.targetShiftId)}
              isManagerOrAdmin={isManagerOrAdmin}
              currentUserId={profile.uid}
              onAction={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Create Swap Modal */}
      {showCreate && (
        <CreateSwapModal
          myShifts={myShifts}
          allShifts={shifts}
          allStaff={allStaff}
          currentUser={profile}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); handleRefresh() }}
        />
      )}
    </div>
  )
}
