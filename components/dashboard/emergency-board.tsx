"use client"

import React, { useEffect, useState } from "react"
import { AlertTriangle, Clock, CheckCircle, UserCheck, Sparkles, Loader2, RefreshCw, XCircle } from "lucide-react"
import { suggestReplacement, type ReplacementSuggestion } from "@/lib/services/groq-service"
import { useAuth } from "@/components/providers/auth-provider"
import {
  getOpenShortageAlerts, respondToShortageAlert, getMyShortageResponse,
  getAllUsers,
  type UserProfile,
} from "@/lib/services/user-service"
import type { Shift, ShortageAlert, Staff } from "@/lib/types"
import { getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// ── Emergency Vacancy Card ────────────────────────────────────────────────────
function EmergencyCard({ alert, profile, onAccepted }: {
  alert: ShortageAlert; profile: UserProfile; onAccepted: () => void
}) {
  const [myResponse, setMyResponse]               = useState<string | null>(null)
  const [loading, setLoading]                     = useState(false)
  const [suggestion, setSuggestion]               = useState<ReplacementSuggestion | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError]     = useState("")
  const [suggestionStaff, setSuggestionStaff]     = useState<any[]>([])
  const [error, setError]                         = useState("")
  const isManagerOrAdmin = profile.role === "ADMIN" || profile.role === "MANAGER"

  useEffect(() => {
    getMyShortageResponse(alert.id, profile.uid).then((r) => {
      if (r) setMyResponse(r.status)
    }).catch((err) => {
      console.error("Error loading my shortage response:", err)
    })
  }, [alert.id, profile.uid])

  const handleAccept = async () => {
    setLoading(true); setError("")
    try {
      await respondToShortageAlert(alert.id, profile.uid, profile.name || profile.email, "ACCEPTED")
      setMyResponse("ACCEPTED")
      onAccepted()
    } catch (err: any) {
      setError(err.message || "Failed to accept shift.")
    } finally { setLoading(false) }
  }

  const handleCancelAlert = async () => {
    const ok = window.confirm("Are you sure you want to cancel this emergency vacancy alert?")
    if (!ok) return
    setLoading(true); setError("")
    try {
      await deleteDoc(doc(db, "shortageAlerts", alert.id))
      onAccepted() // Refresh list
    } catch (err: any) {
      setError(err.message || "Failed to cancel emergency alert.")
    } finally { setLoading(false) }
  }

  const handleRetract = async () => {
    const ok = window.confirm("Are you sure you want to retract your coverage for this emergency shift? It will be re-opened on the vacancy board.")
    if (!ok) return
    setLoading(true); setError("")
    try {
      const { getDocs, query, collection, where, deleteDoc } = await import("firebase/firestore")
      
      // 1. Re-open shortage alert
      await updateDoc(doc(db, "shortageAlerts", alert.id), {
        status: "OPEN",
        assignedTo: null,
        assignedToName: null,
        assignedAt: null,
      })
      
      // 2. Delete the shortage response matching this user and alert
      const snap = await getDocs(
        query(
          collection(db, "shortageResponses"),
          where("alertId", "==", alert.id),
          where("employeeUid", "==", profile.uid)
        )
      )
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "shortageResponses", d.id))))
      
      onAccepted() // Refresh board
    } catch (err: any) {
      setError(err.message || "Failed to retract coverage.")
    } finally { setLoading(false) }
  }

  const handleAISuggest = async () => {
    setLoadingSuggestion(true); setSuggestionError("")
    try {
      const vacantShift: Shift = {
        id: alert.id, staffId: null, staffName: null,
        branchId: alert.branchId, zone: alert.zone,
        day: alert.date, startTime: alert.startTime, endTime: alert.endTime,
        isEmergency: true, status: "vacant",
      }
      
      const allUsers = await getAllUsers()
      const available: Staff[] = allUsers.map((u) => ({
        id: u.uid,
        name: u.name || u.email,
        role: u.role,
        branchId: u.branch || "",
        skills: (u.skills ?? []).map((s) => s.zone),
        availability: "available",
        avatar: "",
      }))
      
      setSuggestionStaff(available)
      const result = await suggestReplacement(vacantShift, available)
      setSuggestion(result)
    } catch (err: any) {
      setSuggestionError(err.message || "Could not get AI suggestion.")
    } finally { setLoadingSuggestion(false) }
  }

  const recommendedStaff = suggestion
    ? suggestionStaff.find((s) => s.id === suggestion.recommendedStaffId)
    : null

  const isClaimedByMe = alert.status === "FILLED" && alert.assignedTo === profile.uid

  if (isClaimedByMe) {
    return (
      <div className="border border-green-500/30 bg-green-500/5 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground">You are covering this vacancy</h3>
              <p className="text-xs text-muted-foreground">{alert.branchName} · {alert.reason}</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-green-500/15 text-green-400 border-green-500/30 shrink-0">CLAIMED</span>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{alert.startTime}–{alert.endTime}</span>
          <span className="font-medium text-foreground">{alert.zone}</span>
          <span>{alert.date}</span>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button onClick={handleRetract} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 border border-destructive/20 hover:bg-destructive hover:text-white font-bold py-2.5 rounded-xl disabled:opacity-60 transition-all cursor-pointer">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          RETRACT COVERAGE (Cancel)
        </button>
      </div>
    )
  }

  return (
    <div className={`border rounded-2xl p-5 space-y-4 ${
      alert.priority === "HIGH" ? "bg-red-500/5 border-red-500/30" : "bg-orange-500/5 border-orange-500/20"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`h-8 w-8 shrink-0 ${alert.priority === "HIGH" ? "text-red-500" : "text-orange-500"}`} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-foreground">Emergency Vacancy</h3>
              {alert.priority === "HIGH" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">🚨 HIGH</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{alert.branchName} · {alert.reason}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
          alert.status === "OPEN" ? "bg-red-500/15 text-red-400 border-red-500/30"
          : "bg-green-500/15 text-green-400 border-green-500/30"
        }`}>{alert.status}</span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{alert.startTime}–{alert.endTime}</span>
        <span className="font-medium text-foreground">{alert.zone}</span>
        <span>{alert.date}</span>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {profile.role === "EMPLOYEE" && alert.status === "OPEN" && (
        alert.createdBy === profile.uid ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground bg-muted/30 border border-border px-3 py-2 rounded-xl">
              You reported this emergency vacancy. If this was a mistake or you are now available, you can cancel it below.
            </p>
            <button onClick={handleCancelAlert} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-destructive/10 border border-destructive/20 hover:bg-destructive hover:text-white font-bold py-2.5 rounded-xl disabled:opacity-60 transition-all cursor-pointer">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              CANCEL EMERGENCY VACANCY
            </button>
          </div>
        ) : myResponse ? (
          <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${
            myResponse === "ACCEPTED" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
          }`}>
            {myResponse === "ACCEPTED" ? <UserCheck className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            You {myResponse.toLowerCase()} this shift
          </div>
        ) : (
          <button onClick={handleAccept} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-60 transition-colors cursor-pointer">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            ACCEPT SHIFT
          </button>
        )
      )}

      {isManagerOrAdmin && (
        <div className="border-t border-border/50 pt-3 space-y-3">
          <div className="flex gap-3">
            <button onClick={handleAISuggest} disabled={loadingSuggestion}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-60 transition-colors cursor-pointer bg-primary/10 border border-primary/20 py-2 rounded-xl">
              {loadingSuggestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Replacement
            </button>
            <button onClick={handleCancelAlert} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-destructive hover:bg-destructive hover:text-white disabled:opacity-60 transition-all cursor-pointer bg-destructive/10 border border-destructive/20 py-2 rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel Alert
            </button>
          </div>
          {suggestionError && <p className="text-xs text-destructive">{suggestionError}</p>}
          {suggestion && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">Best Match</p>
              <p className="font-semibold text-sm">{recommendedStaff?.name ?? suggestion.recommendedStaffId}</p>
              <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
              {suggestion.alternatives?.length > 0 && (
                <div className="pt-1 space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">Alternatives:</p>
                  {suggestion.alternatives.map((alt) => {
                    const s = suggestionStaff.find((x) => x.id === alt.staffId)
                    return (
                      <p key={alt.staffId} className="text-xs text-muted-foreground">
                        • {s?.name ?? alt.staffId} — {alt.reason}
                      </p>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function EmergencyBoard() {
  const { profile } = useAuth()
  const [alerts, setAlerts]               = useState<ShortageAlert[]>([])
  const [claimedAlerts, setClaimedAlerts] = useState<ShortageAlert[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState("")

  const load = async () => {
    setLoading(true); setError("")
    try {
      const openData = await getOpenShortageAlerts()
      setAlerts(openData)

      if (profile?.role === "EMPLOYEE") {
        const { getDocs, query, collection, where } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const snap = await getDocs(
          query(
            collection(db, "shortageAlerts"),
            where("status", "==", "FILLED"),
            where("assignedTo", "==", profile.uid)
          )
        )
        const claimed = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShortageAlert))
        setClaimedAlerts(claimed)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load shortage alerts.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) load()
  }, [profile])

  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Emergency Board</h2>
          <p className="text-sm text-muted-foreground">Open vacancies — first come first serve</p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {/* Section: Your Claimed Emergency Shifts */}
          {profile.role === "EMPLOYEE" && claimedAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" /> Your Claimed Vacancies
              </h3>
              <div className="space-y-4">
                {claimedAlerts.map((alert) => (
                  <EmergencyCard key={alert.id} alert={alert} profile={profile} onAccepted={load} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Available Open Vacancies */}
          <div className="space-y-3">
            {profile.role === "EMPLOYEE" && claimedAlerts.length > 0 && (
              <h3 className="text-lg font-bold text-foreground">Open Vacancies</h3>
            )}
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/10">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                No open emergency vacancies right now.
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <EmergencyCard key={alert.id} alert={alert} profile={profile} onAccepted={load} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
