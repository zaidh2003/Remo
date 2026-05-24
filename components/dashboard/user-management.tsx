"use client"

import { useEffect, useState } from "react"
import { Users, Shield, Loader2, CheckCircle, AlertCircle, RefreshCw, UserPlus, X, Mail, User, Phone, Briefcase, Pencil, ChevronDown, Check } from "lucide-react"
import { getAllUsers, updateUserRole, updateUserProfile, type UserProfile } from "@/lib/services/user-service"
import { useAuth } from "@/components/providers/auth-provider"
import { useBranches } from "@/hooks/use-branches"
import type { AppRole } from "@/lib/types"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth, app } from "@/lib/firebase"
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth"
import { initializeApp, deleteApp } from "firebase/app"
import { DemoDataSeeder } from "@/components/dashboard/demo-data-seeder"

const ROLES: AppRole[] = ["ADMIN", "MANAGER", "EMPLOYEE"]

const roleBadge: Record<AppRole, string> = {
  ADMIN:    "bg-red-500/15 text-red-400 border-red-500/30",
  MANAGER:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EMPLOYEE: "bg-green-500/15 text-green-400 border-green-500/30",
}

// ── Add Employee Modal ────────────────────────────────────────────────────────
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
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email and password are required.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setSaving(true)
    setError("")
    
    const tempAppName = `temp-app-users-${Date.now()}`
    let tempApp;
    try {
      tempApp = initializeApp(app.options, tempAppName)
      const tempAuth = getAuth(tempApp)
      
      const cred = await createUserWithEmailAndPassword(tempAuth, email.trim(), password)
      
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim(),
        branch: branch.trim(),
        role,
        workerTypes: [],
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
      setError(err.message || "Failed to create employee.")
    } finally {
      setSaving(false)
    }
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
      {/* Transparent overlay for click-away catching */}
      <div className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative bg-card border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] w-full max-w-md max-h-[92vh] overflow-y-visible p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
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
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@restaurant.com"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Temporary Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Position</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Head Chef"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>

            {/* Branch (Custom Dropdown) */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
              <button
                type="button"
                onClick={toggleBranchDropdown}
                className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
              >
                <span className="text-foreground truncate max-w-[130px] font-semibold">{branch || "No branch assigned"}</span>
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

            {/* Role (Custom Dropdown) */}
            <div className="space-y-1.5 relative">
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
                  {["EMPLOYEE", "MANAGER", "ADMIN"].map((r) => (
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

// ── Edit User Modal ───────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }: { user: UserProfile; onClose: () => void; onSaved: (updated: Partial<UserProfile>) => void }) {
  const [name, setName]         = useState(user.name ?? "")
  const [phone, setPhone]       = useState(user.phone ?? "")
  const [position, setPosition] = useState(user.position ?? "")
  const [branch, setBranch]     = useState(user.branch ?? "")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")
  const { branches }            = useBranches()

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await updateUserProfile(user.uid, { name: name.trim(), phone: phone.trim(), position: position.trim(), branch: branch.trim() })
      onSaved({ name: name.trim(), phone: phone.trim(), position: position.trim(), branch: branch.trim() })
      onClose()
    } catch (e: any) {
      setError(e.message || "Failed to update profile.")
    } finally {
      setSaving(false)
    }
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
            <Pencil className="h-5 w-5 text-primary" /> Edit Profile
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Editing: <span className="font-semibold text-foreground">{user.email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Position</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Head Chef"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:shadow-sm" />
              </div>
            </div>

            {/* Branch (Custom Dropdown) */}
            <div className="col-span-2 space-y-1.5 relative">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
              <button
                type="button"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none transition-all text-left font-medium shadow-sm cursor-pointer"
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/95 disabled:opacity-60 transition-all cursor-pointer shadow-md hover:shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}

export function UserManagement() {
  const { profile: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (e: any) {
      showToast("err", "Failed to load users: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleRoleChange = async (uid: string, newRole: AppRole) => {
    if (uid === currentUser?.uid && newRole !== "ADMIN") {
      showToast("err", "You cannot remove your own ADMIN role.")
      return
    }
    setSaving(uid)
    try {
      await updateUserRole(uid, newRole)
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, role: newRole } : u))
      showToast("ok", "Role updated successfully.")
    } catch (e: any) {
      showToast("err", "Failed to update role: " + e.message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-sm text-muted-foreground">Assign roles to registered users</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Demo Seeder Center (Admin only) */}
      <DemoDataSeeder />

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          toast.type === "ok"
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {toast.type === "ok"
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Role legend */}
      <div className="flex flex-wrap gap-3">
        {ROLES.map((r) => (
          <span key={r} className={`text-xs font-semibold px-3 py-1 rounded-full border ${roleBadge[r]}`}>
            {r === "ADMIN" && "🔴 "}
            {r === "MANAGER" && "🔵 "}
            {r === "EMPLOYEE" && "🟢 "}
            {r}
          </span>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-1">— role colours</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No users found.</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">User</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Current Role</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Change Role</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Edit Profile</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const isYou = user.uid === currentUser?.uid
                return (
                  <tr
                    key={user.uid}
                    className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${isYou ? "bg-primary/5" : ""}`}
                  >
                    {/* Avatar + name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(user.name ?? user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">
                            {user.name ?? "—"}
                            {isYou && <span className="ml-2 text-xs text-primary font-semibold">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.position || "No position set"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-muted-foreground">{user.email}</td>

                    {/* Current role badge */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadge[user.role]}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Role dropdown */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as AppRole)}
                          disabled={saving === user.uid}
                          className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {saving === user.uid && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                        )}
                      </div>
                    </td>

                    {/* Edit profile button */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-xl p-4 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Role changes are enforced by Firestore security rules — only ADMINs can modify roles.
          The first user to register is automatically promoted to ADMIN.
        </p>
      </div>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { load(); showToast("ok", "Employee account created.") }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev.map((u) => u.uid === editingUser.uid ? { ...u, ...updated } : u))
            showToast("ok", "Profile updated — changes will appear on the user's profile immediately.")
          }}
        />
      )}
    </div>
  )
}
