"use client"

import { useEffect, useState } from "react"
import { Building2, Plus, Pencil, Trash2, Check, X, Loader2, MapPin, User } from "lucide-react"
import { subscribeToBranches, saveBranch, updateBranch, deleteBranch } from "@/lib/services/data-service"
import { getAllUsers, type UserProfile } from "@/lib/services/user-service"
import type { Branch } from "@/lib/types"

function BranchForm({ branch, managers, onClose }: {
  branch?: Branch; managers: UserProfile[]; onClose: () => void
}) {
  const [name, setName]         = useState(branch?.name ?? "")
  const [address, setAddress]   = useState(branch?.address ?? "")
  const [managerId, setManager] = useState(branch?.managerId ?? "")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")

  const handleSave = async () => {
    if (!name.trim()) { setError("Branch name is required."); return }
    setSaving(true); setError("")
    try {
      if (branch) {
        await updateBranch(branch.id, { name: name.trim(), address: address.trim(), managerId })
      } else {
        await saveBranch({ name: name.trim(), address: address.trim(), managerId })
      }
      onClose()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {branch ? "Edit Branch" : "Add Branch"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Branch A"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assign Manager</label>
            <select value={managerId} onChange={(e) => setManager(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">No manager assigned</option>
              {managers.map((m) => (
                <option key={m.uid} value={m.uid}>{m.name || m.email}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/90 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {branch ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [managers, setManagers] = useState<UserProfile[]>([])
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [showAdd, setShowAdd]       = useState(false)

  useEffect(() => {
    const unsub = subscribeToBranches(setBranches)
    getAllUsers().then((users) => setManagers(users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN")))
    return () => unsub()
  }, [])

  const getManagerName = (id?: string) => {
    if (!id) return "—"
    const m = managers.find((u) => u.uid === id)
    return m?.name || m?.email || "—"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Branch Management</h2>
            <p className="text-sm text-muted-foreground">Create and manage restaurant branches</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No branches yet. Click "Add Branch" to create one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{branch.name}</h3>
                    {branch.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{branch.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditBranch(branch)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteBranch(branch.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>Manager: <span className="text-foreground font-medium">{getManagerName(branch.managerId)}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <BranchForm managers={managers} onClose={() => setShowAdd(false)} />}
      {editBranch && <BranchForm branch={editBranch} managers={managers} onClose={() => setEditBranch(null)} />}
    </div>
  )
}
