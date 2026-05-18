"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle, Plus, Sparkles, Loader2, CheckCircle2,
  XCircle, Clock, MapPin, User, Send, RefreshCw,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useBranches } from "@/hooks/use-branches"
import {
  createShortageAlert, getAllShortageAlerts, updateShortageAlertStatus,
  respondToShortageAlert, getMyShortageResponse, getEmployeesWithZones,
  type UserProfile,
} from "@/lib/services/user-service"
import { matchShortage } from "@/lib/services/groq-service"
import type { ShortageAlert, WorkZone } from "@/lib/types"

const ZONES: WorkZone[] = ["Meat", "Salad", "Grill", "Fries", "Dishwashing", "Bar", "Waiter", "Kitchen", "Host"]

const statusColors: Record<string, string> = {
  OPEN:      "bg-red-500/15 text-red-400 border-red-500/30",
  FILLED:    "bg-green-500/15 text-green-400 border-green-500/30",
  CANCELLED: "bg-muted text-muted-foreground border-border",
}

// ── Create Alert Form ─────────────────────────────────────────────────────────
function CreateAlertForm({ onCreated }: { onCreated: () => void }) {
  const { profile } = useAuth()
  const { branches } = useBranches()
  const [zone, setZone]         = useState<WorkZone>("Kitchen")
  const [date, setDate]         = useState("")
  const [start, setStart]       = useState("")
  const [end, setEnd]           = useState("")
  const [reason, setReason]     = useState("")
  // Store the branch ID; derive name from the branches list
  const [branchId, setBranchId] = useState(profile?.branch || "")
  const [saving, setSaving]     = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{ uid: string; name: string; reason: string } | null>(null)
  const [error, setError]       = useState("")

  const handleAiMatch = async () => {
    if (!zone || !date || !start || !end) {
      setError("Fill in zone, date and times first.")
      return
    }
    setAiLoading(true)
    setError("")
    try {
      const employees = await getEmployeesWithZones()
      const mapped = employees
        .filter((e) => e.skills && e.skills.length > 0)
        .map((e) => ({ uid: e.uid, name: e.name || e.email, skills: e.skills! }))
      if (mapped.length === 0) {
        setError("No employees have set their skills yet.")
        setAiLoading(false)
        return
      }
      const match = await matchShortage({ zone, date, startTime: start, endTime: end, reason }, mapped)
      const emp = employees.find((e) => e.uid === match.recommendedUid)
      setAiSuggestion({
        uid: match.recommendedUid,
        name: emp?.name || emp?.email || match.recommendedUid,
        reason: match.reason,
      })
    } catch (e: any) {
      setError("AI match failed: " + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!zone || !date || !start || !end || !reason.trim()) {
      setError("Please fill in all fields.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await createShortageAlert({
        createdBy: profile.uid,
        createdByName: profile.name || profile.email,
        branchId: branchId || profile.branch || "main",
        branchName: branches.find((b) => b.id === branchId)?.name || branchId || profile.branch || "Main Branch",
        zone,
        date,
        startTime: start,
        endTime: end,
        reason: reason.trim(),
        priority: "NORMAL",
        status: "OPEN",
        ...(aiSuggestion?.uid && { aiSuggestedUid: aiSuggestion.uid }),
        ...(aiSuggestion?.reason && { aiReason: aiSuggestion.reason }),
      })
      onCreated()
    } catch (e: any) {
      setError("Failed to send alert: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Send className="h-5 w-5 text-primary" /> Send Shortage Alert
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Zone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone Needed</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value as WorkZone)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        {/* Branch — dropdown from admin-created branches */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Select branch…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Staff sick, No show, Unexpected rush"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* AI Match */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAiMatch}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold disabled:opacity-60 transition-colors"
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI Suggest Best Match
        </button>
        {aiSuggestion && (
          <div className="flex-1 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
            <span className="font-semibold text-primary">{aiSuggestion.name}</span>
            <span className="text-muted-foreground ml-2">— {aiSuggestion.reason}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Broadcast Alert to All Branches
      </button>
    </form>
  )
}

// ── Alert Card (employee view) ────────────────────────────────────────────────
function AlertCard({ alert, currentUser, onRespond }: {
  alert: ShortageAlert
  currentUser: UserProfile
  onRespond: () => void
}) {
  const [myResponse, setMyResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isAiPick = alert.aiSuggestedUid === currentUser.uid

  useEffect(() => {
    getMyShortageResponse(alert.id, currentUser.uid).then((r) => {
      if (r) setMyResponse(r.status)
    })
  }, [alert.id, currentUser.uid])

  const respond = async (status: "ACCEPTED" | "DENIED") => {
    setLoading(true)
    try {
      await respondToShortageAlert(alert.id, currentUser.uid, currentUser.name || currentUser.email, status)
      setMyResponse(status)
      onRespond()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-card border rounded-2xl p-5 space-y-3 ${isAiPick ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
      {isAiPick && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI recommends you for this shift
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            alert.priority === "HIGH" ? "bg-red-500/20 text-red-500" : "bg-orange-500/10 text-orange-500"
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">{alert.zone} — {alert.branchName}</p>
            <p className="text-xs text-muted-foreground">{alert.reason}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {alert.priority === "HIGH" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white uppercase tracking-wide">
              🚨 High Priority
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[alert.status]}`}>
            {alert.status}
          </span>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{alert.startTime} – {alert.endTime}</span>
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{alert.date}</span>
        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />by {alert.createdByName}</span>
      </div>

      {/* Employee response buttons */}
      {currentUser.role === "EMPLOYEE" && alert.status === "OPEN" && (
        myResponse ? (
          <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${
            myResponse === "ACCEPTED" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
          }`}>
            {myResponse === "ACCEPTED" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            You {myResponse.toLowerCase()} this shift
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => respond("ACCEPTED")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl text-sm disabled:opacity-60 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Accept
            </button>
            <button
              onClick={() => respond("DENIED")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 rounded-xl text-sm disabled:opacity-60 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Deny
            </button>
          </div>
        )
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ShortageAlerts() {
  const { profile } = useAuth()
  const [alerts, setAlerts] = useState<ShortageAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"

  const load = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const data = await getAllShortageAlerts(profile)
      setAlerts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shortage Alerts</h2>
          <p className="text-sm text-muted-foreground">
            {isManagerOrAdmin ? "Broadcast staff shortages to all branches" : "Respond to open shift requests"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Alert
            </button>
          )}
        </div>
      </div>

      {showForm && isManagerOrAdmin && (
        <CreateAlertForm onCreated={() => { setShowForm(false); load() }} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          No shortage alerts at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} currentUser={profile} onRespond={load} />
          ))}
        </div>
      )}
    </div>
  )
}
