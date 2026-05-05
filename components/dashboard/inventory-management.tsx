"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { InventoryItem } from "@/lib/types"
import { subscribeToInventory, saveInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/services/data-service"
import { useAuth } from "@/components/providers/auth-provider"
import { Package, AlertTriangle, CheckCircle, AlertCircle, Plus, X, Loader2, Pencil, Trash2, Check } from "lucide-react"

const statusConfig = {
  "in-stock": { color: "bg-success text-success-foreground", icon: CheckCircle, label: "In Stock" },
  "low":      { color: "bg-warning text-warning-foreground", icon: AlertCircle, label: "Low Stock" },
  "critical": { color: "bg-destructive text-destructive-foreground", icon: AlertTriangle, label: "Critical" },
}

function calcStatus(qty: number, min: number): InventoryItem["status"] {
  const r = qty / min
  return r <= 0.3 ? "critical" : r <= 0.7 ? "low" : "in-stock"
}

// ── Add / Edit Item Form ──────────────────────────────────────────────────────
function ItemForm({ item, onClose }: { item?: InventoryItem; onClose: () => void }) {
  const [name, setName]       = useState(item?.name ?? "")
  const [category, setCat]    = useState(item?.category ?? "")
  const [quantity, setQty]    = useState(String(item?.quantity ?? ""))
  const [unit, setUnit]       = useState(item?.unit ?? "")
  const [minStock, setMin]    = useState(String(item?.minStock ?? ""))
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState("")

  const handleSave = async () => {
    const qty = parseFloat(quantity)
    const min = parseFloat(minStock)
    if (!name.trim() || isNaN(qty) || isNaN(min) || !unit.trim()) {
      setError("Fill in all fields with valid numbers."); return
    }
    setSaving(true); setError("")
    try {
      const status = calcStatus(qty, min)
      if (item) {
        await updateInventoryItem(item.id, { name: name.trim(), category, quantity: qty, unit, minStock: min, status })
      } else {
        await saveInventoryItem({ name: name.trim(), category, quantity: qty, unit, minStock: min, status })
      }
      onClose()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{item ? "Edit Item" : "Add Item"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={category} onChange={(e) => setCat(e.target.value)} placeholder="Category (e.g. Proteins)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="grid grid-cols-3 gap-2">
            <input value={quantity} onChange={(e) => setQty(e.target.value)} placeholder="Qty" type="number"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={minStock} onChange={(e) => setMin(e.target.value)} placeholder="Min" type="number"
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
  const [val, setVal]         = useState(String(item.quantity))
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    const qty = parseFloat(val)
    if (isNaN(qty)) return
    setSaving(true)
    const status = calcStatus(qty, item.minStock)
    await updateInventoryItem(item.id, { quantity: qty, status })
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="text-sm hover:underline hover:text-primary transition-colors">
        {item.quantity} {item.unit}
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
      <button onClick={() => { setEditing(false); setVal(String(item.quantity)) }}
        className="p-1 rounded hover:bg-muted"><X className="h-3 w-3" /></button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function InventoryManagement() {
  const { profile } = useAuth()
  const [items, setItems]       = useState<InventoryItem[]>([])
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [showAdd, setShowAdd]   = useState(false)
  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"

  useEffect(() => {
    const unsub = subscribeToInventory(setItems)
    return () => unsub()
  }, [])

  const criticalCount = items.filter((i) => i.status === "critical").length
  const lowCount      = items.filter((i) => i.status === "low").length

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
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              No inventory items yet.
              {isManagerOrAdmin && (
                <p className="text-sm mt-1">Click "Add Item" to get started.</p>
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
                    const pct = Math.min((item.quantity / item.minStock) * 100, 100)
                    return (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
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
                                : <span>{item.quantity} {item.unit}</span>}
                              <span className="text-muted-foreground">min: {item.minStock}</span>
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
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteInventoryItem(item.id)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
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

      {showAdd && <ItemForm onClose={() => setShowAdd(false)} />}
      {editItem && <ItemForm item={editItem} onClose={() => setEditItem(null)} />}
    </>
  )
}
