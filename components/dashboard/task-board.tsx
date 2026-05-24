"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { subscribeToTasks, saveTask, updateTask, deleteTask } from "@/lib/services/data-service"
import { getAllUsers, type UserProfile } from "@/lib/services/user-service"
import { useAuth } from "@/components/providers/auth-provider"
import { Clock, MapPin, User, Plus, X, Loader2, CheckCircle2, Trash2, ChevronDown, Check } from "lucide-react"

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
  const [error, setError]       = useState("")

  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false)
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true); setError("")
    try {
      await saveTask({ title: title.trim(), category, priority, zone, timeWindow, assignedTo: assignedTo || undefined })
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to add task.")
    } finally { setSaving(false) }
  }

  const togglePriorityDropdown = () => {
    setPriorityDropdownOpen(!priorityDropdownOpen)
    setAssigneeDropdownOpen(false)
  }

  const toggleAssigneeDropdown = () => {
    setAssigneeDropdownOpen(!assigneeDropdownOpen)
    setPriorityDropdownOpen(false)
  }

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-3 space-y-2.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-150 relative z-20">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title…"
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" />
      
      <div className="grid grid-cols-2 gap-2">
        {/* Priority (Custom Dropdown) */}
        <div className="relative">
          <button
            type="button"
            onClick={togglePriorityDropdown}
            className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-lg px-2.5 py-1.5 text-xs outline-none transition-all text-left font-medium cursor-pointer"
          >
            <span className="capitalize">{priority}</span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${priorityDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {priorityDropdownOpen && (
            <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-lg shadow-lg animate-in fade-in slide-in-from-top-1 duration-700">
              {["high", "medium", "low"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPriority(p as any)
                    setPriorityDropdownOpen(false)
                  }}
                  className={`flex w-full items-center justify-between text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer capitalize ${priority === p ? 'bg-primary/5 font-bold' : ''}`}
                >
                  <span>{p}</span>
                  {priority === p && <Check className="h-3 w-3 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone"
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
        
        <input value={timeWindow} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 9:00-11:00"
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
        
        {/* Assignee (Custom Dropdown) */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleAssigneeDropdown}
            className="flex items-center justify-between w-full bg-background border border-border hover:border-primary/50 focus:border-primary rounded-lg px-2.5 py-1.5 text-xs outline-none transition-all text-left font-medium cursor-pointer"
          >
            <span className="truncate max-w-[80px]">{assignedTo || "Unassigned"}</span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${assigneeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {assigneeDropdownOpen && (
            <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-700">
              <button
                type="button"
                onClick={() => {
                  setAssign("")
                  setAssigneeDropdownOpen(false)
                }}
                className={`flex w-full items-center justify-between text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${assignedTo === "" ? 'bg-primary/5 font-bold' : ''}`}
              >
                <span>Unassigned</span>
                {assignedTo === "" && <Check className="h-3 w-3 text-primary shrink-0" />}
              </button>
              {staff.map((s) => {
                const nameStr = s.name || s.email
                return (
                  <button
                    key={s.uid}
                    type="button"
                    onClick={() => {
                      setAssign(nameStr)
                      setAssigneeDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${assignedTo === nameStr ? 'bg-primary/5 font-bold' : ''}`}
                  >
                    <span className="truncate max-w-[80px]">{nameStr}</span>
                    {assignedTo === nameStr && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      
      <div className="flex gap-2 pt-0.5">
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-lg disabled:opacity-60 hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
        </button>
        <button onClick={onClose}
          className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs transition-colors cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const [completing, setCompleting] = useState(false)
  const [error, setError]           = useState("")
  const isDone = (task as any).done === true

  const handleComplete = async () => {
    setCompleting(true); setError("")
    try { 
      await updateTask(task.id, { done: true } as any) 
    } catch (err: any) {
      setError(err.message || "Failed to complete task.")
    } finally { 
      setCompleting(false) 
    }
  }

  const handleDelete = async () => {
    setError("")
    try { 
      await deleteTask(task.id) 
    } catch (err: any) {
      setError(err.message || "Failed to delete task.")
    }
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
      {error && <p className="text-[10px] text-destructive leading-none mt-1.5">{error}</p>}
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

  // EMPLOYEE: only see tasks assigned to them; ADMIN/MANAGER: see all tasks
  const myIdentifier = profile?.name || profile?.email || ""
  const visibleTasks = isManagerOrAdmin
    ? tasks
    : tasks.filter((t) => t.assignedTo && t.assignedTo === myIdentifier)

  const tasksByCategory = categories.reduce((acc, cat) => {
    acc[cat] = visibleTasks.filter((t) => t.category === cat)
    return acc
  }, {} as Record<Category, Task[]>)

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Task Board</CardTitle>
          {!isManagerOrAdmin && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              Showing your assigned tasks
            </span>
          )}
        </div>
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
