"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ForecastChart } from "./forecast-chart"
import { TaskBoard } from "./task-board"
import { Users, TrendingUp, DollarSign, Clock } from "lucide-react"

const stats = [
  {
    title: "Active Staff",
    value: "12",
    change: "+2 from yesterday",
    changeType: "positive",
    icon: Users,
  },
  {
    title: "Predicted Covers",
    value: "790",
    change: "+8% vs forecast",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    title: "Labor Cost Today",
    value: "$1,247",
    change: "-8% vs budget",
    changeType: "positive",
    icon: DollarSign,
  },
  {
    title: "Avg Wait Time",
    value: "12 min",
    change: "-3 min improved",
    changeType: "positive",
    icon: Clock,
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-success">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ForecastChart />
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Generate Weekly Schedule
            </button>
            <button className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
              Review Inventory Alerts
            </button>
            <button className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
              Update Staff Availability
            </button>
            <button className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
              View Labor Reports
            </button>
          </CardContent>
        </Card>
      </div>
      <TaskBoard />
    </div>
  )
}
