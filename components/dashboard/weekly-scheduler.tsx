"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Shift } from "@/lib/types"
import { weekDays } from "@/lib/mock-data"
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface WeeklySchedulerProps {
  shifts: Shift[]
  isOptimizing: boolean
  onOptimize: () => void
}

const statusConfig = {
  understaffed: {
    color: "bg-destructive/10 border-destructive/30 text-destructive",
    badge: "bg-destructive text-destructive-foreground",
    icon: AlertTriangle,
    label: "Understaffed",
  },
  optimal: {
    color: "bg-success/10 border-success/30 text-success",
    badge: "bg-success text-success-foreground",
    icon: CheckCircle,
    label: "Optimal",
  },
  overworked: {
    color: "bg-warning/10 border-warning/30 text-warning-foreground",
    badge: "bg-warning text-warning-foreground",
    icon: Clock,
    label: "Overworked",
  },
}

function ShiftCard({ shift }: { shift: Shift }) {
  const config = statusConfig[shift.status]
  const Icon = config.icon

  return (
    <div className={cn("rounded-lg border p-2 transition-all hover:shadow-md", config.color)}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{shift.staffName}</p>
          <p className="text-xs text-muted-foreground">{shift.role}</p>
        </div>
        <Icon className="h-4 w-4 shrink-0" />
      </div>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        {shift.startTime} - {shift.endTime}
      </p>
    </div>
  )
}

export function WeeklyScheduler({ shifts, isOptimizing, onOptimize }: WeeklySchedulerProps) {
  const shiftsByDay = weekDays.reduce((acc, day) => {
    acc[day] = shifts.filter((shift) => shift.day === day)
    return acc
  }, {} as Record<string, Shift[]>)

  const statusCounts = {
    understaffed: shifts.filter((s) => s.status === "understaffed").length,
    optimal: shifts.filter((s) => s.status === "optimal").length,
    overworked: shifts.filter((s) => s.status === "overworked").length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Staff shifts with labor KPI flags</CardDescription>
          </div>
          <Button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Optimize with Groq
              </>
            )}
          </Button>
        </div>
        <div className="flex gap-3 pt-2">
          {Object.entries(statusCounts).map(([status, count]) => {
            const config = statusConfig[status as keyof typeof statusConfig]
            return (
              <Badge key={status} className={cn("gap-1", config.badge)}>
                <config.icon className="h-3 w-3" />
                {config.label}: {count}
              </Badge>
            )
          })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="flex flex-col">
              <div className="mb-2 rounded-md bg-muted px-2 py-1.5 text-center text-sm font-semibold">
                {day.slice(0, 3)}
              </div>
              <div className="flex-1 space-y-2">
                {shiftsByDay[day].length > 0 ? (
                  shiftsByDay[day].map((shift) => <ShiftCard key={shift.id} shift={shift} />)
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center text-xs text-muted-foreground">
                    No shifts
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
