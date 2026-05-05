"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import { forecastData } from "@/lib/mock-data"
import { TrendingUp, Users, Clock, Calendar } from "lucide-react"

const weeklyForecast = [
  { day: "Mon", predicted: 650, actual: 620 },
  { day: "Tue", predicted: 580, actual: 595 },
  { day: "Wed", predicted: 620, actual: 610 },
  { day: "Thu", predicted: 700, actual: 685 },
  { day: "Fri", predicted: 890, actual: 920 },
  { day: "Sat", predicted: 1050, actual: 1080 },
  { day: "Sun", predicted: 820, actual: 790 },
]

const forecastMetrics = [
  { label: "Forecast Accuracy", value: "94.2%", icon: TrendingUp, trend: "+2.1%" },
  { label: "Avg Daily Covers", value: "758", icon: Users, trend: "+45" },
  { label: "Peak Hour", value: "7-8 PM", icon: Clock, trend: "Consistent" },
  { label: "Busiest Day", value: "Saturday", icon: Calendar, trend: "1,080 covers" },
]

export function DemandForecast() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {forecastMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-success">{metric.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hourly Footfall Prediction</CardTitle>
            <CardDescription>Today&apos;s predicted customer traffic by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name="Predicted"
                  />
                  <Area
                    type="monotone"
                    dataKey="historical"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Historical Avg"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Forecast vs Actual</CardTitle>
            <CardDescription>Comparing predictions against real performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyForecast}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="predicted" fill="hsl(var(--chart-1))" name="Predicted" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Peak Hours Analysis</CardTitle>
          <CardDescription>Understanding lunch and dinner rush patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-gradient-to-br from-chart-1/10 to-chart-1/5 p-6">
              <h3 className="text-lg font-semibold">Lunch Rush (11 AM - 2 PM)</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak Time</span>
                  <span className="font-semibold">12:30 - 1:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Covers</span>
                  <span className="font-semibold">240</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommended Staff</span>
                  <span className="font-semibold">8 servers, 3 chefs</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-chart-2/10 to-chart-2/5 p-6">
              <h3 className="text-lg font-semibold">Dinner Rush (6 PM - 10 PM)</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak Time</span>
                  <span className="font-semibold">7:30 - 8:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Covers</span>
                  <span className="font-semibold">365</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommended Staff</span>
                  <span className="font-semibold">12 servers, 4 chefs</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
