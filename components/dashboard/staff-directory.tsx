"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAllUsers, updateUserProfile, type UserProfile } from "@/lib/services/user-service"
import { useAuth } from "@/components/providers/auth-provider"
import { Star, Loader2, RefreshCw, Pencil, X, CheckCircle, AlertCircle, User, Phone, Briefcase, Building2 } from "lucide-react"
import type { SkillLevel } from "@/lib/types"

const levelStars: Record<SkillLevel, number> = {
  Beginner: 1, Intermediate: 2, Expert: 3,
}

const roleColor: Record<string, string> = {
  ADMIN:    "bg-red-500/15 text-red-400",
  MANAGER:  "bg-blue-500/15 text-blue-400",
  EMPLOYEE: "bg-green-500/15 text-green-400",
}

// ── Edit Employee Panel ────────────────────────────────────────────────────────
function EditEmployeePanel({
  member,
  onClose,
  onSaved,
}: {
  member: UserProfile
  onClose: () => void
  onSaved: (updated: UserProfile) => void
}) {
  const [name,     setName]     = useState(member.name     ?? "")
  const [phone,    setPhone]    = useState(member.phone    ?? "")
  const [position, setPosition] = useState(member.position ?? "")
  const [branch,   setBranch]   = useState(member.branch   ?? "")
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState("")

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return }
    setSaving(true)
    setError("")
    try {
      await updateUserProfile(member.uid, {
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim(),
        branch: branch.trim(),
      })
      onSaved({ ...member, name: name.trim(), phone: phone.trim(), position: position.trim(), branch: branch.trim() })
    } catch (e: any) {
      setError(e.message || "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  const initials = (member.name ?? member.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm">{member.name || "Employee"}</h3>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role badge — read-only for MANAGER */}
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase tracking-wide">Role</p>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", roleColor[member.role] ?? "bg-muted text-muted-foreground")}>
              {member.role}
            </span>
            <span className="text-xs text-muted-foreground italic">Role changes require Admin access</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0100"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Position</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Head Chef"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Branch */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch name"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Skills — read-only display */}
          {member.skills && member.skills.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((s) => (
                  <span key={s.zone} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {s.zone} · {s.level}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Skills are managed by the employee via their Profile panel.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </>
  )
}

// ── Staff Directory ────────────────────────────────────────────────────────────
export function StaffDirectory() {
  const { profile } = useAuth()
  const [staff, setStaff]         = useState<UserProfile[]>([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState<UserProfile | null>(null)
  const [toast, setToast]         = useState<string | null>(null)

  const isAdmin          = profile?.role === "ADMIN"
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
      // ADMIN sees everyone; MANAGER and EMPLOYEE see own branch only
      const filtered = isAdmin
        ? all
        : all.filter((u) => u.branch === myBranch)
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
                {isAdmin
                  ? "All registered team members across all branches"
                  : `Team members in your branch${myBranch ? ` (${myBranch})` : ""}`}
              </CardDescription>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toast */}
          {toast && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {toast}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : staff.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No staff found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {staff.map((member) => {
                const initials = (member.name ?? member.email ?? "?")
                  .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

                const topSkillStars = member.skills && member.skills.length > 0
                  ? Math.max(...member.skills.map((s) => levelStars[s.level] ?? 1))
                  : 0

                return (
                  <div
                    key={member.uid}
                    className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-lg space-y-3 relative group"
                  >
                    {/* Edit button — ADMIN/MANAGER only */}
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => setEditing(member)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-primary/10 hover:text-primary"
                        title="Edit employee"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Avatar + name */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 pr-6">
                        <h3 className="truncate font-semibold text-foreground text-sm">
                          {member.name || "—"}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.position || member.email}
                        </p>
                      </div>
                    </div>

                    {/* Role + branch */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={cn("text-xs", roleColor[member.role] ?? "bg-muted text-muted-foreground")}>
                        {member.role}
                      </Badge>
                      {member.branch && (
                        <span className="text-xs text-muted-foreground truncate">{member.branch}</span>
                      )}
                    </div>

                    {/* Skill stars */}
                    {topSkillStars > 0 && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star key={i} className={cn("h-3 w-3",
                            i < topSkillStars ? "fill-primary text-primary" : "text-muted"
                          )} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {member.skills?.[0]?.level}
                        </span>
                      </div>
                    )}

                    {/* Skill zones */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map((s) => (
                          <span
                            key={s.zone}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                          >
                            {s.zone}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Phone */}
                    {member.phone && (
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Panel */}
      {editing && (
        <EditEmployeePanel
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
