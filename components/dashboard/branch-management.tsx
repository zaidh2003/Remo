"use client"

import { useEffect, useState } from "react"
import { Building2, Plus, Pencil, Trash2, Check, X, Loader2, MapPin, User, Brain, Sliders, Database, Users } from "lucide-react"
import { subscribeToBranches, saveBranch, updateBranch, deleteBranch } from "@/lib/services/data-service"
import { getAllUsers, updateUserProfile, type UserProfile } from "@/lib/services/user-service"
import type { Branch, AIWeights } from "@/lib/types"
import { DEFAULT_AI_WEIGHTS } from "@/lib/types"
import { seedAllData } from "@/lib/services/seed-service"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"

function AIWeightsConfig({ weights, onChange }: {
  weights: AIWeights; onChange: (weights: AIWeights) => void
}) {
  const total = weights.skillMatch + weights.proficiency + weights.workload + weights.proximity + weights.experience
  const isValid = total === 100

  const updateWeight = (key: keyof AIWeights, value: number) => {
    onChange({ ...weights, [key]: Math.max(0, Math.min(100, value)) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" />
          AI Decision Weights
        </label>
        <span className={`text-xs font-bold ${isValid ? 'text-success' : 'text-destructive'}`}>
          Total: {total}%
        </span>
      </div>
      <div className="space-y-2 bg-muted/30 rounded-lg p-3">
        {[
          { key: 'skillMatch' as const, label: 'Skill/Zone Match', desc: 'How well skills match the required zone' },
          { key: 'proficiency' as const, label: 'Proficiency Level', desc: 'Expert > Intermediate > Beginner' },
          { key: 'workload' as const, label: 'Current Workload', desc: 'Prefer less busy employees' },
          { key: 'proximity' as const, label: 'Branch Proximity', desc: 'Distance to branch location' },
          { key: 'experience' as const, label: 'Recent Experience', desc: 'Recent work in this zone' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{label}</span>
              <span className="text-xs font-bold text-primary">{weights[key]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={weights[key]}
              onChange={(e) => updateWeight(key, parseInt(e.target.value))}
              className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="text-[10px] text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
      {!isValid && (
        <p className="text-xs text-destructive">⚠️ Weights must total exactly 100%</p>
      )}
    </div>
  )
}

function BranchForm({ branch, managers, onClose }: {
  branch?: Branch; managers: UserProfile[]; onClose: () => void
}) {
  const [name, setName]         = useState(branch?.name ?? "")
  const [address, setAddress]   = useState(branch?.address ?? "")
  const [managerId, setManager] = useState(branch?.managerId ?? "")
  const [aiWeights, setAIWeights] = useState<AIWeights>(branch?.aiWeights ?? DEFAULT_AI_WEIGHTS)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")

  const handleSave = async () => {
    if (!name.trim()) { setError("Branch name is required."); return }
    
    const total = aiWeights.skillMatch + aiWeights.proficiency + aiWeights.workload + aiWeights.proximity + aiWeights.experience
    if (total !== 100) {
      setError("AI weights must total exactly 100%")
      return
    }
    
    setSaving(true); setError("")
    try {
      if (branch) {
        await updateBranch(branch.id, { name: name.trim(), address: address.trim(), managerId, aiWeights })
      } else {
        await saveBranch({ name: name.trim(), address: address.trim(), managerId, aiWeights })
      }
      onClose()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
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

          <div className="border-t pt-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sliders className="h-4 w-4" />
              Advanced: AI Decision Weights
              <span className="text-xs">{showAdvanced ? '▼' : '▶'}</span>
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <AIWeightsConfig weights={aiWeights} onChange={setAIWeights} />
              </div>
            )}
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
  const [seeding, setSeeding]       = useState<string | null>(null)
  const [assigningBranches, setAssigningBranches] = useState(false)

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

  const hasCustomWeights = (branch: Branch) => {
    if (!branch.aiWeights) return false
    const defaults = DEFAULT_AI_WEIGHTS
    return Object.keys(defaults).some(key => 
      branch.aiWeights![key as keyof AIWeights] !== defaults[key as keyof AIWeights]
    )
  }

  const handleAssignBranches = async () => {
    if (!confirm('Assign branches to all users without a branch?\n\nThis will:\n• Get all users from the database\n• Create "Urmo Projects" branch if no branches exist\n• Assign the first branch to users without a branch\n• Skip users who already have a branch')) {
      return
    }

    setAssigningBranches(true)
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      
      if (usersSnapshot.empty) {
        toast.error('No users found in database')
        return
      }

      // Get all branches
      let currentBranches = branches
      if (currentBranches.length === 0) {
        toast.info('No branches found. Creating "Urmo Projects" branch...')
        await saveBranch({
          name: 'Urmo Projects',
          address: 'Main Location',
          managerId: '',
          aiWeights: DEFAULT_AI_WEIGHTS,
        })
        // Wait a bit for the branch to be created and subscription to update
        await new Promise(resolve => setTimeout(resolve, 1000))
        const branchesSnapshot = await getDocs(collection(db, 'branches'))
        currentBranches = branchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch))
      }

      const defaultBranch = currentBranches[0]
      let updatedCount = 0
      let skippedCount = 0

      // Update each user
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data()
        const userId = userDoc.id

        // Skip if user already has a branch
        if (userData.branch && userData.branch.trim() !== '') {
          skippedCount++
          continue
        }

        // Assign default branch
        await updateDoc(doc(db, 'users', userId), {
          branch: defaultBranch.name,
          branchId: defaultBranch.id,
        })

        updatedCount++
      }

      toast.success(`Branch assignment complete!`)
      toast.info(`Updated: ${updatedCount} users, Skipped: ${skippedCount} users`)
      
      // Refresh the page to show updated data
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast.error(`Failed to assign branches: ${error.message}`)
    } finally {
      setAssigningBranches(false)
    }
  }

  const handleSeedData = async (branch: Branch) => {
    if (!confirm(`Seed ${branch.name} with Urmo Projects template data?\n\nThis will add:\n• 6 staff members (1 Manager + 5 specialized employees)\n• ~250 shifts (7 days × 4 time slots × zones)\n• 17 tasks (Preparation, Cooking, Serving, Cleaning, Inventory)\n• 18 inventory items (7 categories)\n\nTemplate: Urmo Projects\nStaff: Andrew Trump (Meat), Marco (Preparation), Mia Khalifa (Dishwashing), Brundan Jagila (Burger), Masood (Potato)`)) {
      return
    }

    setSeeding(branch.id)
    try {
      const result = await seedAllData({
        branchId: branch.id,
        branchName: branch.name,
        includeShifts: true,
        includeTasks: true,
        includeInventory: true,
        includeStaff: false, // Staff creation requires Firebase Auth
      })

      if (result.success) {
        toast.success(result.message)
        toast.info(`Added: ${result.details.shifts} shifts, ${result.details.tasks} tasks, ${result.details.inventory} inventory items`)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(`Failed to seed data: ${error.message}`)
    } finally {
      setSeeding(null)
    }
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
        <div className="flex gap-2">
          <button
            onClick={handleAssignBranches}
            disabled={assigningBranches}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 text-sm font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-60"
          >
            {assigningBranches ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Assign Branches to Users
              </>
            )}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Branch
          </button>
        </div>
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
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>Manager: <span className="text-foreground font-medium">{getManagerName(branch.managerId)}</span></span>
                </div>
                {hasCustomWeights(branch) && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Brain className="h-3.5 w-3.5" />
                    <span className="font-medium">Custom AI weights configured</span>
                  </div>
                )}
                <button
                  onClick={() => handleSeedData(branch)}
                  disabled={seeding === branch.id}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-60"
                >
                  {seeding === branch.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="h-3.5 w-3.5" />
                      Seed with Urmo Template
                    </>
                  )}
                </button>
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
