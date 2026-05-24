"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { InventoryItem, InventoryCategory } from "@/lib/types"
import { subscribeToInventory, saveInventoryItem, updateInventoryItem, deleteInventoryItem, seedInventoryData, sendNotification } from "@/lib/services/data-service"
import { useAuth } from "@/components/providers/auth-provider"
import { Package, AlertTriangle, CheckCircle, AlertCircle, Plus, X, Loader2, Pencil, Trash2, Check, ShoppingCart, Send } from "lucide-react"
import { toast } from "sonner"
import { getUsersByRole } from "@/lib/services/user-service"

const statusConfig = {
  "in-stock": { color: "bg-success text-success-foreground", icon: CheckCircle, label: "In Stock" },
  "low":      { color: "bg-warning text-warning-foreground", icon: AlertCircle, label: "Low Stock" },
  "critical": { color: "bg-destructive text-destructive-foreground", icon: AlertTriangle, label: "Critical" },
}

const CATEGORIES: InventoryCategory[] = [
  "Meat & Seafood",
  "Vegetables & Fruits",
  "Dairy & Eggs",
  "Dry Goods",
  "Beverages",
  "Cleaning Supplies",
  "Disposables"
]

function calcStatus(currentStock: number, minimumStock: number): InventoryItem["status"] {
  const ratio = currentStock / minimumStock
  if (ratio <= 0.5) return "critical"
  if (ratio < 1.0) return "low"
  return "in-stock"
}

// ── Add / Edit Item Form ──────────────────────────────────────────────────────
function ItemForm({ item, branchId, onClose }: { item?: InventoryItem; branchId: string; onClose: () => void }) {
  const [name, setName]       = useState(item?.name ?? "")
  const [category, setCat]    = useState<InventoryCategory>(item?.category ?? "Meat & Seafood")
  const [currentStock, setCurrentStock] = useState(String(item?.currentStock ?? ""))
  const [unit, setUnit]       = useState(item?.unit ?? "")
  const [minimumStock, setMinimumStock] = useState(String(item?.minimumStock ?? ""))
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState("")

  const handleSave = async () => {
    const current = parseFloat(currentStock)
    const minimum = parseFloat(minimumStock)
    if (!name.trim()) {
      setError("Item name is required"); return
    }
    if (isNaN(current) || current < 0) {
      setError("Current stock must be a valid positive number"); return
    }
    if (!unit.trim()) {
      setError("Unit is required (e.g., kg, lbs, units)"); return
    }
    if (isNaN(minimum) || minimum <= 0) {
      setError("Minimum stock must be a positive number"); return
    }
    
    setSaving(true); setError("")
    try {
      if (item) {
        await updateInventoryItem(item.id, { 
          name: name.trim(), 
          category, 
          currentStock: current, 
          unit, 
          minimumStock: minimum 
        })
        toast.success("Item updated successfully")
      } else {
        await saveInventoryItem({ 
          name: name.trim(), 
          category, 
          currentStock: current, 
          unit, 
          minimumStock: minimum,
          branchId 
        })
        toast.success("Item added successfully")
      }
      onClose()
    } catch (e: any) { 
      setError(e.message || "Failed to save item")
      toast.error("Failed to save item")
    }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{item ? "Edit Item" : "Add Item"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <select value={category} onChange={(e) => setCat(e.target.value as InventoryCategory)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} placeholder="Current" type="number"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} placeholder="Min" type="number"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
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
            {item ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inline Quantity Editor ────────────────────────────────────────────────────
function QtyEditor({ item }: { item: InventoryItem }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(String(item.currentStock))
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    const current = parseFloat(val)
    if (isNaN(current) || current < 0) {
      toast.error("Invalid quantity")
      return
    }
    setSaving(true)
    try {
      await updateInventoryItem(item.id, { currentStock: current })
      toast.success("Quantity updated")
      setEditing(false)
    } catch (e: any) {
      toast.error("Failed to update quantity")
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="text-sm hover:underline hover:text-primary transition-colors">
        {item.currentStock} {item.unit}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input type="number" value={val} onChange={(e) => setVal(e.target.value)}
        className="w-20 bg-background border border-primary rounded px-2 py-0.5 text-sm outline-none" />
      <button onClick={handleSave} disabled={saving}
        className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      </button>
      <button onClick={() => { setEditing(false); setVal(String(item.currentStock)) }}
        className="p-1 rounded hover:bg-muted"><X className="h-3 w-3" /></button>
    </div>
  )
}

// ── Reorder Dialog ────────────────────────────────────────────────────────────
function ReorderDialog({ items, branchId, onClose }: { items: InventoryItem[]; branchId: string; onClose: () => void }) {
  const [selectedItems, setSelected] = useState<Set<string>>(new Set())
  const [quantities, setQuantities]  = useState<Record<string, number>>({})
  const [sending, setSending]        = useState(false)
  const [supplier, setSupplier]      = useState("")
  const [notes, setNotes]            = useState("")

  const toggleItem = (id: string, suggestedQty: number) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(id)) {
      newSet.delete(id)
      const newQty = { ...quantities }
      delete newQty[id]
      setQuantities(newQty)
    } else {
      newSet.add(id)
      setQuantities({ ...quantities, [id]: suggestedQty })
    }
    setSelected(newSet)
  }

  const updateQty = (id: string, val: number) => {
    setQuantities({ ...quantities, [id]: Math.max(1, val) })
  }

  const handleSendOrder = async () => {
    if (selectedItems.size === 0) {
      toast.error("Select at least one item to reorder")
      return
    }
    if (!supplier.trim()) {
      toast.error("Supplier name is required")
      return
    }

    setSending(true)
    try {
      // Build order summary
      const orderSummary = Array.from(selectedItems).map(id => {
        const item = items.find(i => i.id === id)!
        return `${item.name}: ${quantities[id]} ${item.unit}`
      }).join(", ")
      
      // Get all managers and admins for this branch
      const managers = await getUsersByRole("MANAGER")
      const admins = await getUsersByRole("ADMIN")
      const recipients = [...managers.filter(m => m.branchId === branchId), ...admins]
      
      // Send notification to each manager/admin
      const notificationPromises = recipients.map(recipient =>
        sendNotification(
          recipient.id,
          "Inventory Reorder Request",
          `Reorder request from ${supplier}: ${orderSummary}${notes ? ` | Notes: ${notes}` : ""}`,
          "general"
        )
      )
      
      await Promise.all(notificationPromises)
      
      toast.success(`Reorder request sent to ${recipients.length} manager(s)`)
      toast.info(`Items: ${orderSummary}`)
      
      onClose()
    } catch (e: any) {
      toast.error("Failed to send reorder request")
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const totalItems = selectedItems.size
  const totalCost = Array.from(selectedItems).reduce((sum, id) => {
    // Estimate cost (in production, items would have unit prices)
    return sum + (quantities[id] || 0) * 10
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="font-bold text-lg">Reorder Items</h3>
            <p className="text-sm text-muted-foreground">Select items to reorder from supplier</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-3">
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier name *"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Items to Reorder</p>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No items available</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const isSelected = selectedItems.has(item.id)
                  const suggestedQty = Math.max(item.minimumStock - item.currentStock, item.minimumStock)
                  const cfg = statusConfig[item.status]
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                      onClick={() => toggleItem(item.id, suggestedQty)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge className={cn("gap-1 text-xs", cfg.color)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Current: {item.currentStock} {item.unit} | Min: {item.minimumStock} {item.unit}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            value={quantities[item.id] || suggestedQty}
                            onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-20 bg-background border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary"
                          />
                          <span className="text-sm text-muted-foreground">{item.unit}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              <p className="font-semibold">Order Summary</p>
              <p className="text-muted-foreground">{totalItems} items selected</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Estimated Cost</p>
              <p className="text-lg font-bold">${totalCost.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendOrder}
              disabled={sending || selectedItems.size === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 hover:bg-primary/90 transition-colors"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function InventoryManagement() {
  const { profile } = useAuth()
  const [items, setItems]       = useState<InventoryItem[]>([])
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [showReorder, setShowReorder] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [seeding, setSeeding]   = useState(false)
  const [error, setError]       = useState("")
  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"
  const branchId = profile?.branch || profile?.managedBranches?.[0] || "Main Branch"

  useEffect(() => {
    try {
      const unsub = subscribeToInventory(branchId, (newItems) => {
        setItems(newItems)
        setLoading(false)
        setError("")
      })
      return () => unsub()
    } catch (e: any) {
      setError("Failed to load inventory")
      setLoading(false)
      toast.error("Failed to load inventory")
    }
  }, [branchId])

  const handleSeedData = async () => {
    if (!branchId) return
    setSeeding(true)
    try {
      await seedInventoryData(branchId)
      toast.success("Inventory seeded with 18 items")
    } catch (e: any) {
      toast.error("Failed to seed inventory")
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return
    
    try {
      await deleteInventoryItem(id)
      toast.success("Item deleted successfully")
    } catch (e: any) {
      toast.error("Failed to delete item")
    }
  }

  const criticalCount = items.filter((i) => i.status === "critical").length
  const lowCount      = items.filter((i) => i.status === "low").length
  const needsReorder  = items.filter((i) => i.status === "critical" || i.status === "low")

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Live stock levels — click quantity to update</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {criticalCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground gap-1">
                  <AlertTriangle className="h-3 w-3" />{criticalCount} Critical
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge className="bg-warning text-warning-foreground gap-1">
                  <AlertCircle className="h-3 w-3" />{lowCount} Low
                </Badge>
              )}
              {isManagerOrAdmin && items.length === 0 && !loading && (
                <button onClick={handleSeedData} disabled={seeding}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60">
                  {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  Seed Data
                </button>
              )}
              {isManagerOrAdmin && needsReorder.length > 0 && (
                <button onClick={() => setShowReorder(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors">
                  <ShoppingCart className="h-4 w-4" /> Reorder ({needsReorder.length})
                </button>
              )}
              {isManagerOrAdmin && (
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading inventory...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              No inventory items yet.
              {isManagerOrAdmin && (
                <p className="text-sm mt-1">Click "Seed Data" to add 18 sample items or "Add Item" to create manually.</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Stock Level</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    {isManagerOrAdmin && <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const cfg = statusConfig[item.status]
                    const Icon = cfg.icon
                    const pct = Math.min((item.currentStock / item.minimumStock) * 100, 100)
                    return (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              {isManagerOrAdmin
                                ? <QtyEditor item={item} />
                                : <span>{item.currentStock} {item.unit}</span>}
                              <span className="text-muted-foreground">min: {item.minimumStock}</span>
                            </div>
                            <Progress value={pct} className={cn("h-2",
                              item.status === "critical" && "[&>div]:bg-destructive",
                              item.status === "low"      && "[&>div]:bg-warning",
                              item.status === "in-stock" && "[&>div]:bg-success"
                            )} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("gap-1", cfg.color)}>
                            <Icon className="h-3 w-3" />{cfg.label}
                          </Badge>
                        </td>
                        {isManagerOrAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => setEditItem(item)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="Edit item">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDelete(item.id, item.name)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                title="Delete item">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && <ItemForm branchId={branchId} onClose={() => setShowAdd(false)} />}
      {editItem && <ItemForm item={editItem} branchId={branchId} onClose={() => setEditItem(null)} />}
      {showReorder && <ReorderDialog items={needsReorder} branchId={branchId} onClose={() => setShowReorder(false)} />}
    </>
  )
}
