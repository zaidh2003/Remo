"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { initialTasks } from "@/lib/mock-data"
import { Clock, MapPin, User } from "lucide-react"

const categories = ["Preparation", "Cooking", "Serving", "Cleaning", "Inventory Management"] as const

const categoryColors: Record<string, string> = {
  "Preparation": "bg-chart-1/10 border-chart-1/30",
  "Cooking": "bg-chart-2/10 border-chart-2/30",
  "Serving": "bg-chart-3/10 border-chart-3/30",
  "Cleaning": "bg-chart-4/10 border-chart-4/30",
  "Inventory Management": "bg-chart-5/10 border-chart-5/30",
}

const categoryHeaderColors: Record<string, string> = {
  "Preparation": "bg-chart-1",
  "Cooking": "bg-chart-2",
  "Serving": "bg-chart-3",
  "Cleaning": "bg-chart-4",
  "Inventory Management": "bg-chart-5",
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className={cn("rounded-lg border p-3 transition-shadow hover:shadow-md", categoryColors[task.category])}>
      <div className="mb-2 flex items-start justify-between">
        <h4 className="text-sm font-medium leading-tight text-foreground">{task.title}</h4>
        <Badge
          variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}
          className="ml-2 shrink-0 text-xs"
        >
          {task.priority}
        </Badge>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {task.timeWindow}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {task.zone}
        </div>
        {task.assignedTo && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.assignedTo}
          </div>
        )}
      </div>
    </div>
  )
}

export function TaskBoard() {
  const tasksByCategory = categories.reduce((acc, category) => {
    acc[category] = initialTasks.filter((task) => task.category === category)
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Recurring Tasks Board</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {categories.map((category) => (
            <div key={category} className="flex flex-col">
              <div className={cn("mb-3 rounded-lg px-3 py-2 text-center text-sm font-semibold text-white", categoryHeaderColors[category])}>
                {category}
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  {tasksByCategory[category].length}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                {tasksByCategory[category].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
