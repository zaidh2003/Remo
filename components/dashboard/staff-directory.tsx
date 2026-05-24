"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAllUsers, updateUserProfile, type UserProfile } from "@/lib/services/user-service"
import { useAuth } from "@/components/providers/auth-provider"
import { useBranches } from "@/hooks/use-branches"
import { Star, Loader2, RefreshCw, Pencil, X, CheckCircle, AlertCircle, User, Phone, Briefcase, Building2, UserPlus, Mail, Lock, Plus, Trash2, ChevronDown, Check } from "lucide-react"
import type { AppRole, SkillLevel, WorkZone } from "@/lib/types"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth, app } from "@/lib/firebase"
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth"
import { initializeApp, deleteApp } from "firebase/app"

const levelStars: Record<SkillLevel, number> = {
  Beginner: 1, Intermediate: 2, Expert: 3,
}

const roleColor: Record<string, string> = {
  ADMIN:    "bg-red-500/15 text-red-400",
  MANAGER:  "bg-blue-500/15 text-blue-400",
  EMPLOYEE: "bg-green-500/15 text-green-400",
}

// Deterministic colour palette for branches — same name → same colour always
const BRANCH_PALETTES = [
  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "bg-pink-500/15 text-pink-400 border-pink-500/30",
]

function branchColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return BRANCH_PALETTES[hash % BRANCH_PALETTES.length]
}

// ── Edit Employee Panel ────────────────────────────────────────────────────────
const ALL_ZONES: WorkZone[] = ["Meat","Salad","Grill","Fries","Dishwashing","Bar","Waiter","Kitchen","Host"]
const ALL_LEVELS: SkillLevel[] = ["Beginner","Intermediate","Expert"]

function EditEmployeePanel({
  member, onClose, onSaved,
}: {
  member: UserProfile
  onClose: () => void
  onSaved: (updated: UserProfile) => void
}) {
  const [name,     setName]     = useState(member.name     ?? "")
  const [phone,    setPhone]    = useState(member.phone    ?? "")
  const [position, setPosition] = useState(member.position ?? "")
  const [branch,   setBranch]   = useState(member.branch   ?? "")
  const [skills,   setSkills]   = useState<{ zone: WorkZone; level: SkillLevel }[]>(
    (member.skills ?? []) as { zone: WorkZone; level: SkillLevel }[]
  )
  const [newZone,  setNewZone]  = useState<WorkZone>("Kitchen")
  const [newLevel, setNewLevel] = useState<SkillLevel>("Beginner")
  const { branches } = useBranches()
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState("")

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)

  const usedZones = skills.map((s) => s.zone)
  const availableZones = ALL_ZONES.filter((z) => !usedZones.includes(z))

  const addSkill = () => {
    if (usedZones.includes(newZone)) return
    const updated = [...skills, { zone: newZone, level: newLevel }]
    setSkills(updated)
    const next = ALL_ZONES.find((z) => !updated.map((s) => s.zone).includes(z))
    if (next) setNewZone(next)
  }

  const removeSkill = (zone: WorkZone) =>
    setSkills((prev) => prev.filter((s) => s.zone !== zone))

  const updateLevel = (zone: WorkZone, level: SkillLevel) =>
    setSkills((prev) => prev.map((s) => s.zone === zone ? { ...s, level } : s))

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return }
    setSaving(true)
    setError("")
    try {
      await updateUserProfile(member.uid, {
        name: name.trim(), phone: phone.trim(),
        position: position.trim(), branch: branch.trim(),
        skills,
      })
      onSaved({ ...member, name: name.trim(), phone: phone.trim(), position: position.trim(), branch: branch.trim(), skills })
    } catch (e: any) {
      setError(e.message || "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  const initials = (member.name ?? member.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer" onClick={onClose} />
      
      <div className="relative bg-card border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] w-full max-w-md max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-visible"
        onClick={(e) => e.stopPropagation()}>
        {/* Top subtle brand gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-violet-600 rounded-t-2xl z-10" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 mt-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">{member.name || "Employee"}</h3>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", roleColor[member.role] ?? "bg-muted text-muted-foreground")}>
              {member.role}
            </span>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:shadow-sm" />
            </div>
          </div>

          {/* Phone + Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Position</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Head Chef"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:shadow-sm" />
              </div>
            </div>
          </div>

          {/* Branch (Custom Dropdown) */}
          <div className="space-y-1 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <button
                type="button"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
              >
                <span className="text-foreground font-semibold">{branch || "No branch assigned"}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {branchDropdownOpen && (
                <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setBranch("")
                      setBranchDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${branch === "" ? 'bg-primary/5 font-bold' : ''}`}
                  >
                    <span>No branch assigned</span>
                    {branch === "" && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBranch(b.name)
                        setBranchDropdownOpen(false)
                      }}
                      className={`flex w-full items-center justify-between text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${branch === b.name ? 'bg-primary/5 font-bold' : ''}`}
                    >
                      <span>{b.name}</span>
                      {branch === b.name && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Specializations ── */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-primary" /> Specializations
            </label>

            {/* Existing skills */}
            {skills.length > 0 ? (
              <div className="space-y-1.5">
                {skills.map((s) => (
                  <div key={s.zone} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
                    <span className="text-sm font-semibold flex-1">{s.zone}</span>
                    <select
                      value={s.level}
                      onChange={(e) => updateLevel(s.zone, e.target.value as SkillLevel)}
                      className="bg-primary/10 text-primary text-xs font-semibold rounded-lg px-2 py-1 outline-none border-none cursor-pointer"
                    >
                      {ALL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={() => removeSkill(s.zone)}
                      className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No specializations set.</p>
            )}

            {/* Add new skill row */}
            {availableZones.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <select value={newZone} onChange={(e) => setNewZone(e.target.value as WorkZone)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary">
                  {availableZones.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <select value={newLevel} onChange={(e) => setNewLevel(e.target.value as SkillLevel)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary">
                  {ALL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={addSkill}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/95 disabled:opacity-60 transition-all cursor-pointer shadow-md hover:shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Add Employee Modal ───────────────────────────────────────────────────────────
function AddEmployeeModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [phone, setPhone]       = useState("")
  const [position, setPosition] = useState("")
  const [branch, setBranch]     = useState("")
  const [role, setRole]         = useState<AppRole>("EMPLOYEE")
  const [password, setPassword] = useState("")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")
  const { branches }            = useBranches()

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name) { setError("Name, email and password are required."); return }
    setSaving(true); setError("")
    
    const tempAppName = `temp-app-staff-${Date.now()}`
    let tempApp;
    try {
      tempApp = initializeApp(app.options, tempAppName)
      const tempAuth = getAuth(tempApp)
      
      const cred = await createUserWithEmailAndPassword(tempAuth, email, password)
      
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim(),
        branch: branch.trim(),
        role,
        createdAt: serverTimestamp(),
      })
      
      await signOut(tempAuth)
      await deleteApp(tempApp)
      onAdded()
      onClose()
    } catch (err: any) {
      if (tempApp) {
        try { await deleteApp(tempApp) } catch (_) {}
      }
      setError(err.message || "Failed to create account.")
    } finally { setSaving(false) }
  }

  const toggleBranchDropdown = () => {
    setBranchDropdownOpen(!branchDropdownOpen)
    setRoleDropdownOpen(false)
  }

  const toggleRoleDropdown = () => {
    setRoleDropdownOpen(!roleDropdownOpen)
    setBranchDropdownOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer" onClick={onClose} />
      
      <div className="relative bg-card border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] w-full max-w-md max-h-[90vh] overflow-y-visible p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Top subtle brand gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-violet-600 rounded-t-2xl" />

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" /> Add Employee
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" required
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@example.com" required
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Position</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Head Chef"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>

            {/* Branch (Custom Dropdown) */}
            <div className="space-y-1 relative">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
              <button
                type="button"
                onClick={toggleBranchDropdown}
                className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
              >
                <span className="text-foreground truncate max-w-[130px] font-semibold">{branch || "No branch"}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {branchDropdownOpen && (
                <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setBranch("")
                      setBranchDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${branch === "" ? 'bg-primary/5 font-bold' : ''}`}
                  >
                    <span>No branch</span>
                    {branch === "" && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBranch(b.name)
                        setBranchDropdownOpen(false)
                      }}
                      className={`flex w-full items-center justify-between text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${branch === b.name ? 'bg-primary/5 font-bold' : ''}`}
                    >
                      <span>{b.name}</span>
                      {branch === b.name && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role (Custom Dropdown) */}
            <div className="space-y-1 relative">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</label>
              <button
                type="button"
                onClick={toggleRoleDropdown}
                className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
              >
                <span className="text-foreground font-semibold">{role}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-100">
                  {["EMPLOYEE", "MANAGER"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r as AppRole)
                        setRoleDropdownOpen(false)
                      }}
                      className={`flex w-full items-center justify-between text-left px-4 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${role === r ? 'bg-primary/5 font-bold' : ''}`}
                    >
                      <span>{r}</span>
                      {role === r && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/95 disabled:opacity-60 transition-all cursor-pointer shadow-md hover:shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Create Account
          </button>
        </form>
      </div>
    </div>
  )
}


// ── Staff Directory ────────────────────────────────────────────────────────────
export function StaffDirectory() {
  const { profile } = useAuth()
  const [staff, setStaff]           = useState<UserProfile[]>([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState<UserProfile | null>(null)
  const [addingEmployee, setAdding] = useState(false)
  const [toast, setToast]           = useState<string | null>(null)

  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"
  const myBranch         = profile?.branch ?? ""

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const all = await getAllUsers()
      // ADMIN + MANAGER see everyone; EMPLOYEE sees only own branch
      const filtered = isManagerOrAdmin ? all : all.filter((u) => u.branch === myBranch)
      setStaff(filtered)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [profile?.uid])

  const handleSaved = (updated: UserProfile) => {
    setStaff((prev) => prev.map((m) => m.uid === updated.uid ? updated : m))
    setEditing(null)
    showToast(`${updated.name}'s profile updated successfully.`)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>
                {isManagerOrAdmin
                  ? "All registered team members across all branches"
                  : `Team members in your branch${myBranch ? ` (${myBranch})` : ""}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isManagerOrAdmin && (
                <button onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <UserPlus className="h-4 w-4" /> Add Employee
                </button>
              )}
              <button onClick={load} disabled={loading}
                className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {toast && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
              <CheckCircle className="h-4 w-4 shrink-0" />{toast}
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <StaffDirectoryContent
              staff={staff}
              myBranch={myBranch}
              isManagerOrAdmin={isManagerOrAdmin}
              onEdit={setEditing}
            />
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditEmployeePanel
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {addingEmployee && (
        <AddEmployeeModal
          onClose={() => setAdding(false)}
          onAdded={() => { load(); showToast("Employee account created successfully.") }}
        />
      )}
    </>
  )
}

// ── Filtered grid sub-component ────────────────────────────────────────────────
function StaffDirectoryContent({
  staff, myBranch, isManagerOrAdmin, onEdit,
}: {
  staff: UserProfile[]
  myBranch: string
  isManagerOrAdmin: boolean
  onEdit: (m: UserProfile) => void
}) {
  const [search, setSearch]             = useState("")
  const [branchFilter, setBranchFilter] = useState("all")

  // All unique branch names in the staff list
  const branches = Array.from(
    new Set(staff.map((u) => u.branch || "").filter(Boolean))
  ).sort()

  const visible = staff.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.position ?? "").toLowerCase().includes(q)

    const matchesBranch =
      branchFilter === "all"        ? true
      : branchFilter === "mine"     ? (u.branch || "") === myBranch
      : branchFilter === "__none__" ? !u.branch
      : (u.branch || "") === branchFilter

    return matchesSearch && matchesBranch
  })

  const pillBase = "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap"
  const pillOn   = "bg-primary text-primary-foreground border-primary"
  const pillOff  = "bg-background border-border text-muted-foreground hover:border-primary hover:text-primary"

  return (
    <div className="space-y-4">
      {/* Filters — managers/admins only */}
      {isManagerOrAdmin && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, position or email…"
              className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Branch pills */}
          <div className="flex flex-wrap gap-2">
            {/* All */}
            <button onClick={() => setBranchFilter("all")} className={cn(pillBase, branchFilter === "all" ? pillOn : pillOff)}>
              All ({staff.length})
            </button>

            {/* My Branch — uses the branch's own colour */}
            {myBranch && (
              <button
                onClick={() => setBranchFilter("mine")}
                className={cn(pillBase, branchColor(myBranch),
                  branchFilter === "mine" ? "opacity-100 font-bold" : "opacity-70 hover:opacity-100"
                )}
              >
                ★ My Branch · {myBranch} ({staff.filter((u) => (u.branch || "") === myBranch).length})
              </button>
            )}

            {/* Each branch with its own colour */}
            {branches.filter((b) => b !== myBranch).map((b) => (
              <button key={b} onClick={() => setBranchFilter(b)}
                className={cn(pillBase, branchColor(b),
                  branchFilter === b ? "opacity-100 font-bold" : "opacity-60 hover:opacity-100"
                )}>
                {b} ({staff.filter((u) => (u.branch || "") === b).length})
              </button>
            ))}

            {/* No branch */}
            {staff.some((u) => !u.branch) && (
              <button onClick={() => setBranchFilter("__none__")}
                className={cn(pillBase,
                  branchFilter === "__none__"
                    ? "bg-muted text-foreground border-muted-foreground"
                    : pillOff
                )}>
                No Branch ({staff.filter((u) => !u.branch).length})
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {visible.length} of {staff.length} staff members
          </p>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No staff match your filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((member) => {
            const initials = (member.name ?? member.email ?? "?")
              .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
            const topSkillStars = member.skills?.length
              ? Math.max(...member.skills.map((s) => levelStars[s.level] ?? 1))
              : 0

            return (
              <div key={member.uid} className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-lg space-y-3 relative group">
                {/* Edit button */}
                {isManagerOrAdmin && (
                  <button onClick={() => onEdit(member)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-primary/10 hover:text-primary"
                    title="Edit employee">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Avatar + name */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pr-6">
                    <h3 className="truncate font-semibold text-foreground text-sm">{member.name || "—"}</h3>
                    <p className="text-xs text-muted-foreground truncate">{member.position || member.email}</p>
                  </div>
                </div>

                {/* Role + branch */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge className={cn("text-xs", roleColor[member.role] ?? "bg-muted text-muted-foreground")}>
                    {member.role}
                  </Badge>
                  {member.branch && (
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                      branchColor(member.branch)
                    )}>
                      {member.branch}
                    </span>
                  )}
                </div>

                {/* Skill stars */}
                {topSkillStars > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3", i < topSkillStars ? "fill-primary text-primary" : "text-muted")} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{member.skills?.[0]?.level}</span>
                  </div>
                )}

                {/* Specializations */}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((s) => (
                      <span key={s.zone} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {s.zone}
                      </span>
                    ))}
                  </div>
                )}

                {/* Phone */}
                {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
