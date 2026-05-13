"use client"

import { useEffect, useState } from "react"
import {
  RefreshCw, Loader2, CheckCircle2, XCircle, Clock, MapPin, User, ArrowRightLeft, Plus, X, Check
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

  // Other people's shifts (not mine)
  const otherShifts = allShifts.filter((s) => s.staffId && s.staffId !== currentUser.uid)

  const handleCreate = async () => {
    if (!myShiftId || !targetShiftId) {
      setError("Please select both shifts."); return
    }
    const targetShift = allShifts.find((s) => s.id === targetShiftId)
    if (!targetShift?.staffId) {
      setError("Target shift has no assigned staff."); return
    }
    const targetStaff = allStaff.find((u) => u.uid === targetShift.staffId)
    setSaving(true); setError("")
    try {
      await createSwapRequest({
        requesterId:     currentUser.uid,
        requesterName:   currentUser.name || currentUser.email || "Unknown",
        requesterShiftId: myShiftId,
        targetId:        targetShift.staffId,
        targetName:      targetStaff?.name || targetStaff?.email || "Unknown",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" /> Request Shift Swap
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* My shift to give away */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              My Shift (giving away)
            </label>
            <select
              value={myShiftId}
              onChange={(e) => setMyShiftId(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select your shift…</option>
              {myShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.day} · {s.zone} · {s.startTime}–{s.endTime}
                </option>
              ))}
            </select>
          </div>

          {/* Target shift to receive */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Swap With (colleague's shift)
            </label>
            <select
              value={targetShiftId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select colleague's shift…</option>
              {otherShifts.map((s) => {
                const staff = allStaff.find((u) => u.uid === s.staffId)
                return (
                  <option key={s.id} value={s.id}>
                    {s.day} · {s.zone} · {s.startTime}–{s.endTime} ({staff?.name || "Unknown"})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/90 transition-colors"
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
  onAction 
}: {
  swapRequest: SwapRequest
  requesterShift: Shift | null
  targetShift: Shift | null
  isManagerOrAdmin: boolean
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
