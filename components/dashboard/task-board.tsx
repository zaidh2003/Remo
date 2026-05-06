"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { subscribeToTasks, saveTask, updateTask, deleteTask } from "@/lib/services/data-service"
import { getAllUsers, type UserProfile } from "@/lib/services/user-service"
import { useAuth } from "@/components/providers/auth-provider"
import { Clock, MapPin, User, Plus, X, Loader2, CheckCircle2, Trash2 } from "lucide-react"

const categories = ["Preparation", "Cooking", "Serving", "Cleaning", "Inventory Management"] as const
type Category = typeof categories[number]

const categoryColors: Record<Category, string> = {
  "Preparation":          "bg-chart-1/10 border-chart-1/30",
  "Cooking":              "bg-chart-2/10 border-chart-2/30",
  "Serving":              "bg-chart-3/10 border-chart-3/30",
  "Cleaning":             "bg-chart-4/10 border-chart-4/30",
  "Inventory Management": "bg-chart-5/10 border-chart-5/30",
}

const categoryHeaderColors: Record<Category, string> = {
  "Preparation":          "bg-chart-1",
  "Cooking":              "bg-chart-2",
  "Serving":              "bg-chart-3",
  "Cleaning":             "bg-chart-4",
  "Inventory Management": "bg-chart-5",
}

// ── Add Task Form ─────────────────────────────────────────────────────────────
function AddTaskForm({ category, staff, onClose }: {
  category: Category; staff: UserProfile[]; onClose: () => void
}) {
  const [title, setTitle]       = useState("")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [zone, setZone]         = useState("")
  const [timeWindow, setTime]   = useState("")
  const [assignedTo, setAssign] = useState("")
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await saveTask({ title: title.trim(), category, priority, zone, timeWindow, assignedTo: assignedTo || undefined })
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-3 space-y-2 mt-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title…"
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
      <div className="grid grid-cols-2 gap-2">
        <select value={priority} onChange={(e) => setPriority(e.target.value as any)}
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone"
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
        <input value={timeWindow} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 9:00-11:00"
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
        <select value={assignedTo} onChange={(e) => setAssign(e.target.value)}
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary">
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.uid} value={s.name || s.email}>{s.name || s.email}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-lg disabled:opacity-60 hover:bg-primary/90 transition-colors">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
        </button>
        <button onClick={onClose}
          className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const [completing, setCompleting] = useState(false)
  const isDone = (task as any).done === true

  const handleComplete = async () => {
    setCompleting(true)
    try { await updateTask(task.id, { done: true } as any) }
    finally { setCompleting(false) }
  }

  const handleDelete = async () => {
    await deleteTask(task.id)
  }

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-shadow hover:shadow-md group",
      categoryColors[task.category as Category] ?? "bg-muted/20 border-border",
      isDone && "opacity-50"
    )}>
      <div className="mb-2 flex items-start justify-between gap-1">
        <h4 className={cn("text-sm font-medium leading-tight text-foreground", isDone && "line-through")}>
          {task.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}
            className="text-xs">{task.priority}</Badge>
          {canEdit && !isDone && (
            <button onClick={handleComplete} disabled={completing}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-green-500/20 text-green-500"
              title="Mark complete">
              {completing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            </button>
          )}
          {canEdit && (
            <button onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/20 text-destructive"
              title="Delete">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        {task.timeWindow && <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.timeWindow}</div>}
        {task.zone && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.zone}</div>}
        {task.assignedTo && <div className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedTo}</div>}
      </div>
    </div>
  )
}

// ── Main Task Board ───────────────────────────────────────────────────────────
export function TaskBoard() {
  const { profile } = useAuth()
  const [tasks, setTasks]       = useState<Task[]>([])
  const [staff, setStaff]       = useState<UserProfile[]>([])
  const [addingTo, setAddingTo] = useState<Category | null>(null)
  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"

  useEffect(() => {
    const unsub = subscribeToTasks((incoming) => {
      setTasks(incoming)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (isManagerOrAdmin) getAllUsers().then(setStaff)
  }, [isManagerOrAdmin])

  const tasksByCategory = categories.reduce((acc, cat) => {
    acc[cat] = tasks.filter((t) => t.category === cat)
    return acc
  }, {} as Record<Category, Task[]>)

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Task Board</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div key={cat} className="flex flex-col">
              <div className={cn("mb-3 rounded-lg px-3 py-2 text-center text-sm font-semibold text-white", categoryHeaderColors[cat])}>
                {cat}
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  {tasksByCategory[cat].length}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                {tasksByCategory[cat].map((task) => (
                  <TaskCard key={task.id} task={task} canEdit={isManagerOrAdmin} />
                ))}
                {isManagerOrAdmin && (
                  addingTo === cat ? (
                    <AddTaskForm category={cat} staff={staff} onClose={() => setAddingTo(null)} />
                  ) : (
                    <button onClick={() => setAddingTo(cat)}
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary text-xs transition-colors">
                      <Plus className="h-3 w-3" /> Add task
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
