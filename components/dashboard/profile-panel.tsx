"use client"

import { useState, useRef, useEffect } from "react"
import {
  User, Mail, Phone, Briefcase, Shield, LogOut, X, Check,
  Loader2, Pencil, ChefHat, Star, Thermometer, AlertTriangle, ChevronDown
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useLang } from "@/components/providers/language-provider"
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

const inputCls = "w-full bg-background border-2 border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

// ── Sick Leave Modal ──────────────────────────────────────────────────────────
export function SickLeaveModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
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
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false)

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
    if (!profile || !start || !end) { setError(t.fillAllFields); return }
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
      {/* Transparent click-catcher to avoid double overlay darkness */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      <div className="relative bg-card border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] w-full max-w-sm max-h-[90vh] overflow-y-visible p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Top subtle brand error gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-t-2xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-red-500" /> {t.reportSickLeave}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7" />
            </div>
            <p className="font-semibold text-foreground">{t.sickLeaveReported}</p>
            <p className="text-sm text-muted-foreground">
              {type === "SUDDEN_ILLNESS"
                ? t.highPriorityAlertSent
                : t.alertSentToManager}
            </p>
            <button 
              onClick={onClose} 
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.leaveType}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("SUDDEN_ILLNESS")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                    type === "SUDDEN_ILLNESS"
                      ? "border-red-500 bg-red-500/10 text-red-500"
                      : "border-border hover:border-red-500/55 text-muted-foreground bg-background"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  {t.suddenIllness}
                  {type === "SUDDEN_ILLNESS" && (
                    <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full tracking-wider mt-0.5">{t.highPriority}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setType("OTHER")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                    type === "OTHER"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/55 text-muted-foreground bg-background"
                  }`}
                >
                  <Thermometer className="h-5 w-5" />
                  {t.otherReason}
                </button>
              </div>
            </div>

            {/* Zone (Custom Dropdown Selection) */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.yourZone}</label>
              
              <button
                type="button"
                onClick={() => setZoneDropdownOpen(!zoneDropdownOpen)}
                className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-4 py-3 text-sm outline-none transition-all text-left font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                <span className="text-foreground font-semibold">{zone}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${zoneDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {zoneDropdownOpen && (
                <div className="absolute z-[70] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                  {myZones.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => {
                        setZone(z)
                        setZoneDropdownOpen(false)
                      }}
                      className={`flex w-full items-center justify-between text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${zone === z ? 'bg-primary/5 hover:bg-primary/10 font-bold' : ''}`}
                    >
                      <span className="text-foreground">{z}</span>
                      {zone === z && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date + times */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.date}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.from}</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.to}</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>

            {/* Note */}
            {type === "OTHER" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.note}</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.reason}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={saving}
              className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-white transition-all cursor-pointer shadow-md disabled:opacity-60 ${
                type === "SUDDEN_ILLNESS" ? "bg-red-500 hover:bg-red-600 hover:shadow-lg" : "bg-primary hover:bg-primary/90 hover:shadow-lg"
              }`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Thermometer className="h-4 w-4" />}
              {type === "SUDDEN_ILLNESS" ? t.sendAlert : t.submitLeave}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Skill Zone Editor ─────────────────────────────────────────────────────────
function SkillEditor({
  skills, onChange, editing, t
}: {
  skills: WorkerSkill[]
  onChange: (s: WorkerSkill[]) => void
  editing: boolean
  t: any
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
    if (skills.length === 0) return <span className="text-sm text-muted-foreground">{t.noneSet}</span>
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
  const { t } = useLang()
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
        <div ref={panelRef}
          className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 max-h-[90vh] overflow-y-auto">

          {/* Header with gradient background */}
          <div className="h-32 bg-gradient-to-br from-primary via-blue-600 to-purple-600 relative shrink-0">
            <button onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all hover:rotate-90 duration-300">
              <X className="h-4 w-4" />
            </button>
            
            {/* Decorative circles */}
            <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="px-6 pb-6">
            {/* Profile Avatar */}
            <div className="-mt-16 mb-6 flex items-end justify-between">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-blue-600 border-4 border-card flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {initials}
                </div>
                {/* Online status indicator */}
                <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-card shadow-lg" />
              </div>
              
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-sm font-semibold transition-all hover:shadow-md">
                  <Pencil className="h-4 w-4" /> {t.edit}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all hover:shadow-lg">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {t.save}
                  </button>
                  <button onClick={handleCancel}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-all">
                    {t.cancel}
                  </button>
                </div>
              )}
            </div>

            {/* Role Badge */}
            {profile?.role && (
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${roleBadge[profile.role]} shadow-sm`}>
                  <Shield className="h-3 w-3" />
                  {profile.role}
                </span>
              </div>
            )}

            {/* Success/Error Messages */}
            {saved && (
              <div className="mb-4 flex items-center gap-2 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-300">
                <Check className="h-4 w-4 shrink-0" /> {t.profileSaved}
              </div>
            )}
            {error && (
              <div className="mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-300">{error}</div>
            )}

            {/* Profile Fields */}
            <div className="space-y-3">
              <Field icon={<User className="h-4 w-4" />} label={t.fullName} editing={editing}>
                {editing ? <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="John Smith" />
                  : <span className="text-sm font-semibold text-foreground">{name || "—"}</span>}
              </Field>

              <Field icon={<Mail className="h-4 w-4" />} label={t.email} editing={false}>
                <span className="text-sm text-muted-foreground break-all">{profile?.email}</span>
              </Field>

              <Field icon={<Phone className="h-4 w-4" />} label={t.phone} editing={editing}>
                {editing ? <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+1 555 0100" />
                  : <span className="text-sm font-semibold text-foreground">{phone || "—"}</span>}
              </Field>

              <Field icon={<Briefcase className="h-4 w-4" />} label={t.position} editing={editing}>
                {editing ? <input value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls} placeholder="Head Chef" />
                  : <span className="text-sm font-semibold text-foreground">{position || "—"}</span>}
              </Field>

              <Field icon={<Shield className="h-4 w-4" />} label={t.branch} editing={editing}>
                {editing ? <input value={branch} onChange={(e) => setBranch(e.target.value)} className={inputCls} placeholder="Branch A" />
                  : <span className="text-sm font-semibold text-foreground">{branch || "—"}</span>}
              </Field>

              {/* Skills — employees only */}
              {profile?.role === "EMPLOYEE" && (
                <Field icon={<ChefHat className="h-4 w-4" />} label={t.skillsProficiency} editing={editing}>
                  <SkillEditor skills={skills} onChange={setSkills} editing={editing} t={t} />
                </Field>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {/* Sick leave button — employees only */}
              {profile?.role === "EMPLOYEE" && (
                <button
                  onClick={() => setShowSickLeave(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 text-sm font-bold transition-all hover:shadow-lg hover:shadow-red-500/20"
                >
                  <Thermometer className="h-4 w-4" /> {t.reportSickLeave}
                </button>
              )}

              <button
                onClick={() => {
                  sessionStorage.setItem("remo_logged_out", "true")
                  auth.signOut()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 text-sm font-bold transition-all hover:shadow-lg hover:shadow-destructive/20">
                <LogOut className="h-4 w-4" /> {t.signOut}
              </button>
            </div>
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
    <div className={`group flex items-start gap-3 p-4 rounded-xl transition-all border ${
      editing 
        ? "bg-muted/50 border-border hover:border-primary/50" 
        : "bg-muted/20 border-transparent hover:bg-muted/30"
    }`}>
      <div className={`mt-0.5 shrink-0 transition-colors ${
        editing ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {children}
      </div>
    </div>
  )
}
