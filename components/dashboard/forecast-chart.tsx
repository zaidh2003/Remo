"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { forecastData } from "@/lib/mock-data"
import { getForecastInsight, type ForecastInsight } from "@/lib/services/groq-service"
import { Sparkles, Loader2, AlertTriangle } from "lucide-react"

export function ForecastChart() {
  const [insight, setInsight] = useState<ForecastInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInsight = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getForecastInsight(forecastData)
      setInsight(result)
    } catch (e: any) {
      setError(e.message || "Failed to get insight")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Predicted Customer Footfall</CardTitle>
            <CardDescription>Peak Operating Hours - Lunch &amp; Dinner Rushes</CardDescription>
          </div>
          <button
            onClick={handleInsight}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold disabled:opacity-60 transition-colors shrink-0"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Insight
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Legend />
              <ReferenceLine x="13:00" stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: "Lunch Peak", fill: "hsl(var(--primary))", fontSize: 12 }} />
              <ReferenceLine x="20:00" stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: "Dinner Peak", fill: "hsl(var(--primary))", fontSize: 12 }} />
              <Line type="monotone" dataKey="predicted" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Predicted" />
              <Line type="monotone" dataKey="historical" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Historical Avg" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Groq insight panel */}
        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-500">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {insight && (
          <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Groq AI Insight
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Peak Hour</p>
                <p className="font-semibold">{insight.peakHour}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommendation</p>
                <p className="font-medium">{insight.recommendation}</p>
              </div>
            </div>
            {insight.staffingAlert && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-xs text-yellow-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {insight.staffingAlert}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Lunch Peak (12-2 PM)</p>
            <p className="text-xl font-bold text-foreground">~95 covers</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Dinner Peak (7-9 PM)</p>
            <p className="text-xl font-bold text-foreground">~120 covers</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Total Predicted</p>
            <p className="text-xl font-bold text-foreground">790 covers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
