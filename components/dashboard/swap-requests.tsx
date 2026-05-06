"use client"

import { useEffect, useState } from "react"
import {
  RefreshCw, Loader2, CheckCircle2, XCircle, Clock, MapPin, User, ArrowRightLeft
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import {
  getSwapRequests, approveSwapRequest, rejectSwapRequest
} from "@/lib/services/data-service"
import { getShifts } from "@/lib/services/data-service"
import type { SwapRequest, Shift } from "@/lib/types"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  APPROVED_BY_TARGET: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  APPROVED_BY_MANAGER: "bg-green-500/15 text-green-400 border-green-500/30",
  REJECTED: "bg-muted text-muted-foreground border-border",
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
    setLoading(true)
    setError("")
    try {
      await approveSwapRequest(swapRequest.id)
      onAction()
    } catch (e: any) {
      setError("Failed to approve: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    setError("")
    try {
      await rejectSwapRequest(swapRequest.id)
      onAction()
    } catch (e: any) {
      setError("Failed to reject: " + e.message)
    } finally {
      setLoading(false)
    }
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
        {/* Requester's Shift (giving away) */}
        <div className="bg-background/50 border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            {swapRequest.requesterName} (giving away)
          </div>
          {requesterShift ? (
            <div className="space-y-1">
              <p className="font-bold text-lg">{requesterShift.zone}</p>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {requesterShift.day}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {requesterShift.startTime} – {requesterShift.endTime}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Shift not found</p>
          )}
        </div>

        {/* Target's Shift (receiving) */}
        <div className="bg-background/50 border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            {swapRequest.targetName} (receiving)
          </div>
          {targetShift ? (
            <div className="space-y-1">
              <p className="font-bold text-lg">{targetShift.zone}</p>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {targetShift.day}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {targetShift.startTime} – {targetShift.endTime}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Shift not found</p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Action buttons for managers and admins */}
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
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"

  // Load shifts to display shift details
  const loadShifts = async () => {
    try {
      const allShifts = await getShifts()
      setShifts(allShifts)
    } catch (e) {
      console.error("Failed to load shifts:", e)
    }
  }

  // Subscribe to real-time swap requests
  useEffect(() => {
    if (!profile) return

    loadShifts()

    const unsubscribe = getSwapRequests((requests) => {
      setSwapRequests(requests)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [profile])

  const handleRefresh = () => {
    setLoading(true)
    loadShifts()
  }

  if (!profile) return null

  // Find shift by ID
  const findShift = (shiftId: string) => shifts.find(s => s.id === shiftId) || null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Swap Requests</h2>
          <p className="text-sm text-muted-foreground">
            {isManagerOrAdmin 
              ? "Review and approve shift swap requests from employees" 
              : "View pending shift swap requests"}
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : swapRequests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 opacity-30" />
          No swap requests at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {swapRequests.map((request) => (
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
    </div>
  )
}
