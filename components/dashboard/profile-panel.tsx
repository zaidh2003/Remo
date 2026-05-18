"use client"

import { useState, useRef, useEffect } from "react"
import {
  User, Mail, Phone, Briefcase, Shield, LogOut, X, Check,
  Loader2, Pencil, ChefHat, Star, Thermometer, AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { updateUserProfile, reportSickLeave } from "@/lib/services/user-service"
import { auth } from "@/lib/firebase"
import type { WorkZone, WorkerSkill, SkillLevel, SickLeaveType } from "@/lib/types"

const ALL_ZONES: WorkZone[] = ["Meat", "Salad", "Grill", "Fries", "Dishwashing", "Bar", "Waiter", "Kitchen", "Host"]
const LEVELS: SkillLevel[] = ["Beginner", "Intermediate", "Expert"]

const levelColor: Record<SkillLevel, string> = {
  Beginner:     "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  Intermediate: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Expert:       "bg-green-500/15 text-green-500 border-green-500/30",
}

const levelStars: Record<SkillLevel, number> = { Beginner: 1, Intermediate: 2, Expert: 3 }

const roleBadge: Record<string, string> = {
  ADMIN:    "bg-red-500/15 text-red-400 border border-red-500/30",
  MANAGER:  "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  EMPLOYEE: "bg-green-500/15 text-green-400 border border-green-500/30",
}

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors"

// ── Sick Leave Modal ──────────────────────────────────────────────────────────
function SickLeaveModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth()
  const [type, setType]       = useState<SickLeaveType>("SUDDEN_ILLNESS")
  const [zone, setZone]       = useState<WorkZone>("Kitchen")
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0])
  const [start, setStart]     = useState("")
  const [end, setEnd]         = useState("")
  const [note, setNote]       = useState("")
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState("")

  // Pre-fill zones from employee skills
  const myZones = profile?.skills?.map((s) => s.zone) ?? profile?.workerTypes ?? ALL_ZONES

  // Auto-calculate remaining shift time from today's scheduled shifts
  useEffect(() => {
    const autoFill = async () => {
      if (!profile) return
      try {
        const { getDocs, collection, query, where } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const today = new Date().toISOString().split("T")[0]
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

        const snap = await getDocs(
          query(collection(db, "shifts"),
            where("staffId", "==", profile.uid),
            where("weekLabel", "==", today.slice(0, 10))
          )
        )
        // Find a shift happening right now
        const activeShift = snap.docs
          .map((d) => d.data())
          .find((s) => s.startTime <= currentTime && s.endTime >= currentTime)

        if (activeShift) {
          setStart(currentTime)
          setEnd(activeShift.endTime)
          if (activeShift.zone) setZone(activeShift.zone as WorkZone)
        } else {
          // No active shift found — default to current time
          setStart(currentTime)
        }
      } catch {
        const now = new Date()
        setStart(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
      }
    }
    autoFill()
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !start || !end) { setError("Please fill in all fields."); return }
    setSaving(true)
    setError("")
    try {
      await reportSickLeave(profile, type, zone, date, start, end, note)
      setDone(true)
    } catch (e: any) {
      setError(e.message || "Failed to submit.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-red-500" /> Report Sick Leave
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {done ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7" />
            </div>
            <p className="font-semibold">Sick leave reported.</p>
            <p className="text-sm text-muted-foreground">
              {type === "SUDDEN_ILLNESS"
                ? "🚨 High priority alert sent to all branches."
                : "Alert sent to your manager."}
            </p>
            <button onClick={onClose} className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Leave Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("SUDDEN_ILLNESS")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    type === "SUDDEN_ILLNESS"
                      ? "border-red-500 bg-red-500/10 text-red-500"
                      : "border-border hover:border-red-500/50 text-muted-foreground"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  Sudden Illness
                  {type === "SUDDEN_ILLNESS" && (
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">HIGH PRIORITY</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setType("OTHER")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    type === "OTHER"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Thermometer className="h-5 w-5" />
                  Other Reason
                </button>
              </div>
            </div>

            {/* Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Zone</label>
              <select value={zone} onChange={(e) => setZone(e.target.value as WorkZone)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                {myZones.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            {/* Date + times */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>

            {/* Note */}
            {type === "OTHER" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note (optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Brief reason..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={saving}
              className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-white transition-colors disabled:opacity-60 ${
                type === "SUDDEN_ILLNESS" ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
              }`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Thermometer className="h-4 w-4" />}
              {type === "SUDDEN_ILLNESS" ? "Send High Priority Alert" : "Submit Sick Leave"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Skill Zone Editor ─────────────────────────────────────────────────────────
function SkillEditor({
  skills, onChange, editing,
}: {
  skills: WorkerSkill[]
  onChange: (s: WorkerSkill[]) => void
  editing: boolean
}) {
  const toggle = (zone: WorkZone) => {
    const exists = skills.find((s) => s.zone === zone)
    if (exists) {
      onChange(skills.filter((s) => s.zone !== zone))
    } else {
      onChange([...skills, { zone, level: "Beginner" }])
    }
  }

  const setLevel = (zone: WorkZone, level: SkillLevel) => {
    onChange(skills.map((s) => s.zone === zone ? { ...s, level } : s))
  }

  if (!editing) {
    if (skills.length === 0) return <span className="text-sm text-muted-foreground">None set — edit to add skills</span>
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {skills.map((s) => (
          <span key={s.zone} className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${levelColor[s.level]}`}>
            {Array.from({ length: levelStars[s.level] }).map((_, i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-current" />
            ))}
            {s.zone}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2 mt-1">
      <div className="flex flex-wrap gap-1.5">
        {ALL_ZONES.map((z) => {
          const active = skills.find((s) => s.zone === z)
          return (
            <button key={z} type="button" onClick={() => toggle(z)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary"
              }`}>
              {z}
            </button>
          )
        })}
      </div>

      {/* Proficiency per selected zone */}
      {skills.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {skills.map((s) => (
            <div key={s.zone} className="flex items-center gap-2">
              <span className="text-xs font-semibold w-20 shrink-0">{s.zone}</span>
              <div className="flex gap-1">
                {LEVELS.map((lvl) => (
                  <button key={lvl} type="button" onClick={() => setLevel(s.zone, lvl)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold transition-colors ${
                      s.level === lvl ? levelColor[lvl] : "border-border text-muted-foreground hover:border-primary"
                    }`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Profile Panel ────────────────────────────────────────────────────────
export function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth()
  const panelRef = useRef<HTMLDivElement>(null)

  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState("")
  const [showSickLeave, setShowSickLeave] = useState(false)

  const [name, setName]         = useState(profile?.name     ?? "")
  const [phone, setPhone]       = useState(profile?.phone    ?? "")
  const [position, setPosition] = useState(profile?.position ?? "")
  const [branch, setBranch]     = useState(profile?.branch   ?? "")
  const [skills, setSkills]     = useState<WorkerSkill[]>(profile?.skills ?? [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Don't close the profile panel while the sick leave modal is open
      if (showSickLeave) return
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose, showSickLeave])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError("")
    try {
      // Also keep workerTypes in sync for backwards compat
      const workerTypes = skills.map((s) => s.zone)
      await updateUserProfile(profile.uid, { name, phone, position, branch, skills, workerTypes })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message || "Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(profile?.name ?? "")
    setPhone(profile?.phone ?? "")
    setPosition(profile?.position ?? "")
    setBranch(profile?.branch ?? "")
    setSkills(profile?.skills ?? [])
    setEditing(false)
    setError("")
  }

  // Sync local state when the profile context changes externally
  // (e.g. admin/manager updated this user's details from another screen)
  useEffect(() => {
    if (!editing) {
      setName(profile?.name ?? "")
      setPhone(profile?.phone ?? "")
      setPosition(profile?.position ?? "")
      setBranch(profile?.branch ?? "")
      setSkills(profile?.skills ?? [])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const initials = (profile?.name ?? profile?.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div ref={panelRef}
          className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 max-h-[90vh] overflow-y-auto">

          <div className="h-20 bg-gradient-to-br from-primary to-blue-600 relative shrink-0">
            <button onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 border-4 border-card flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {initials}
              </div>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button onClick={handleCancel}
                    className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {profile?.role && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge[profile.role]}`}>
                {profile.role}
              </span>
            )}

            {saved && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                <Check className="h-4 w-4 shrink-0" /> Profile saved
              </div>
            )}
            {error && (
              <div className="mt-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>
            )}

            <div className="mt-4 space-y-3">
              <Field icon={<User className="h-4 w-4" />} label="Full Name" editing={editing}>
                {editing ? <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="John Smith" />
                  : <span className="text-sm font-medium">{name || "—"}</span>}
              </Field>

              <Field icon={<Mail className="h-4 w-4" />} label="Email" editing={false}>
                <span className="text-sm text-muted-foreground">{profile?.email}</span>
              </Field>

              <Field icon={<Phone className="h-4 w-4" />} label="Phone" editing={editing}>
                {editing ? <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+1 555 0100" />
                  : <span className="text-sm font-medium">{phone || "—"}</span>}
              </Field>

              <Field icon={<Briefcase className="h-4 w-4" />} label="Position" editing={editing}>
                {editing ? <input value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls} placeholder="Head Chef" />
                  : <span className="text-sm font-medium">{position || "—"}</span>}
              </Field>

              <Field icon={<Shield className="h-4 w-4" />} label="Branch" editing={editing}>
                {editing ? <input value={branch} onChange={(e) => setBranch(e.target.value)} className={inputCls} placeholder="Branch A" />
                  : <span className="text-sm font-medium">{branch || "—"}</span>}
              </Field>

              {/* Skills — employees only */}
              {profile?.role === "EMPLOYEE" && (
                <Field icon={<ChefHat className="h-4 w-4" />} label="Skills & Proficiency" editing={editing}>
                  <SkillEditor skills={skills} onChange={setSkills} editing={editing} />
                </Field>
              )}
            </div>

            {/* Sick leave button — employees only */}
            {profile?.role === "EMPLOYEE" && (
              <button
                onClick={() => setShowSickLeave(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-sm font-semibold transition-colors"
              >
                <Thermometer className="h-4 w-4" /> Report Sick Leave
              </button>
            )}

            <button
              onClick={() => {
                sessionStorage.setItem("remo_logged_out", "true")
                auth.signOut()
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-semibold transition-colors">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {showSickLeave && <SickLeaveModal onClose={() => setShowSickLeave(false)} />}
    </>
  )
}

function Field({ icon, label, editing, children }: {
  icon: React.ReactNode; label: string; editing: boolean; children: React.ReactNode
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${editing ? "bg-muted/40" : "bg-muted/20"}`}>
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}
