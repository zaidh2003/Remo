"use client"

import React, { useEffect, useState } from "react"
import { AlertTriangle, Clock, CheckCircle, UserCheck, Sparkles, Loader2, RefreshCw, Send } from "lucide-react"
import { suggestReplacement, type ReplacementSuggestion } from "@/lib/services/groq-service"
import { useAuth } from "@/components/providers/auth-provider"
import {
  getOpenShortageAlerts, respondToShortageAlert, getMyShortageResponse,
  type UserProfile,
} from "@/lib/services/user-service"
import { staffData } from "@/lib/mock-data"
import type { Shift, ShortageAlert } from "@/lib/types"
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// ── Shift Swap Form ───────────────────────────────────────────────────────────
function SwapRequestForm({ profile, onSent }: { profile: UserProfile; onSent: () => void }) {
  const [zone, setZone]     = useState<string>(profile.skills?.[0]?.zone ?? "Kitchen")
  const [day, setDay]       = useState("")
  const [start, setStart]   = useState("")
  const [end, setEnd]       = useState("")
  const [note, setNote]     = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!day || !start || !end) { setError("Fill in all fields."); return }
    setSaving(true); setError("")
    try {
      await addDoc(collection(db, "swapRequests"), {
        requestedBy: profile.uid,
        requestedByName: profile.name || profile.email,
        zone, day, startTime: start, endTime: end,
        note: note.trim(), status: "OPEN",
        createdAt: serverTimestamp(),
      })
      onSent()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <h4 className="font-semibold text-sm">Request a Shift Swap</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Zone</label>
          <input value={zone} onChange={(e) => setZone(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date</label>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)"
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button type="submit" disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/90 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit Swap Request
      </button>
    </form>
  )
}

// ── Swap Requests List ────────────────────────────────────────────────────────
function SwapList({ profile }: { profile: UserProfile }) {
  const [swaps, setSwaps]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const isManagerOrAdmin = profile.role === "ADMIN" || profile.role === "MANAGER"

  const load = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, "swapRequests"))
    setSwaps(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRespond = async (id: string, status: "APPROVED" | "REJECTED") => {
    await updateDoc(doc(db, "swapRequests", id), { status, respondedBy: profile.uid })
    load()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Shift Swaps</h3>
        <div className="flex gap-2">
          <button onClick={load}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {profile.role === "EMPLOYEE" && (
            <button onClick={() => setShowForm(!showForm)}
              className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              + Request Swap
            </button>
          )}
        </div>
      </div>

      {showForm && profile.role === "EMPLOYEE" && (
        <SwapRequestForm profile={profile} onSent={() => { setShowForm(false); load() }} />
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : swaps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No swap requests at the moment.</p>
      ) : (
        swaps.map((swap) => (
          <div key={swap.id} className="bg-card border border-border p-4 rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-sm">{swap.requestedByName} — {swap.zone}</h4>
                <p className="text-xs text-muted-foreground">{swap.day} · {swap.startTime}–{swap.endTime}</p>
                {swap.note && <p className="text-xs text-muted-foreground mt-0.5">"{swap.note}"</p>}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                swap.status === "APPROVED" ? "bg-green-500/15 text-green-400 border-green-500/30"
                : swap.status === "REJECTED" ? "bg-red-500/15 text-red-400 border-red-500/30"
                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
              }`}>{swap.status}</span>
            </div>
            {isManagerOrAdmin && swap.status === "OPEN" && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleRespond(swap.id, "APPROVED")}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                  Approve
                </button>
                <button onClick={() => handleRespond(swap.id, "REJECTED")}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ── Emergency Vacancy Card ────────────────────────────────────────────────────
function EmergencyCard({ alert, profile, onAccepted }: {
  alert: ShortageAlert; profile: UserProfile; onAccepted: () => void
}) {
  const [myResponse, setMyResponse]               = useState<string | null>(null)
  const [loading, setLoading]                     = useState(false)
  const [suggestion, setSuggestion]               = useState<ReplacementSuggestion | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError]     = useState("")
  const isManagerOrAdmin = profile.role === "ADMIN" || profile.role === "MANAGER"

  useEffect(() => {
    getMyShortageResponse(alert.id, profile.uid).then((r) => {
      if (r) setMyResponse(r.status)
    })
  }, [alert.id, profile.uid])

  const handleAccept = async () => {
    setLoading(true)
    try {
      await respondToShortageAlert(alert.id, profile.uid, profile.name || profile.email, "ACCEPTED")
      setMyResponse("ACCEPTED")
      onAccepted()
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
      const available = staffData.filter((s) => s.availability === "available")
      const result = await suggestReplacement(vacantShift, available as any)
      setSuggestion(result)
    } catch { setSuggestionError("Could not get AI suggestion.") }
    finally { setLoadingSuggestion(false) }
  }

  const recommendedStaff = suggestion
    ? staffData.find((s) => s.id === suggestion.recommendedStaffId)
    : null

  return (
    <div className={`border rounded-2xl p-5 space-y-4 ${
      alert.priority === "HIGH" ? "bg-red-500/5 border-red-500/30" : "bg-orange-500/5 border-orange-500/20"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`h-8 w-8 shrink-0 ${alert.priority === "HIGH" ? "text-red-500" : "text-orange-500"}`} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base">Emergency Vacancy</h3>
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

      {profile.role === "EMPLOYEE" && alert.status === "OPEN" && (
        myResponse ? (
          <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${
            myResponse === "ACCEPTED" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
          }`}>
            {myResponse === "ACCEPTED" ? <UserCheck className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            You {myResponse.toLowerCase()} this shift
          </div>
        ) : (
          <button onClick={handleAccept} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-60 transition-colors">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            ACCEPT SHIFT
          </button>
        )
      )}

      {isManagerOrAdmin && (
        <div className="border-t border-border/50 pt-3 space-y-3">
          <button onClick={handleAISuggest} disabled={loadingSuggestion}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-60 transition-colors">
            {loadingSuggestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ask Groq for best replacement
          </button>
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
                    const s = staffData.find((x) => x.id === alt.staffId)
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
  const [alerts, setAlerts]   = useState<ShortageAlert[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const data = await getOpenShortageAlerts(); setAlerts(data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Emergency Board</h2>
          <p className="text-sm text-muted-foreground">Open vacancies — first come first serve</p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
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

      <div className="border-t border-border pt-6">
        <SwapList profile={profile} />
      </div>
    </div>
  )
}
