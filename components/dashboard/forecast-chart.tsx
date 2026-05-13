"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { forecastData as mockForecast } from "@/lib/mock-data"
import { getForecastEntries, saveForecastEntry } from "@/lib/services/data-service"
import { getForecastInsight, type ForecastInsight } from "@/lib/services/groq-service"
import { Sparkles, Loader2, AlertTriangle, Plus, X, Check } from "lucide-react"
import type { ForecastData } from "@/lib/types"
import { useAuth } from "@/components/providers/auth-provider"

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

// ── Add Entry Form ────────────────────────────────────────────────────────────
function AddEntryForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [time, setTime]           = useState("12:00")
  const [predicted, setPredicted] = useState("")
  const [historical, setHistorical] = useState("")
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    const p = parseFloat(predicted)
    const h = parseFloat(historical)
    if (!time || isNaN(p) || isNaN(h)) return
    setSaving(true)
    try {
      await saveForecastEntry(todayStr(), { time, predicted: p, historical: h })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
        className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary w-28" />
      <input type="number" value={predicted} onChange={(e) => setPredicted(e.target.value)} placeholder="Predicted"
        className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary w-24" />
      <input type="number" value={historical} onChange={(e) => setHistorical(e.target.value)} placeholder="Historical"
        className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary w-24" />
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 hover:bg-primary/90 transition-colors">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
      </button>
      <button onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
    </div>
  )
}

// ── Main Chart ────────────────────────────────────────────────────────────────
export function ForecastChart() {
  const { profile } = useAuth()
  const [data, setData]           = useState<ForecastData[]>(mockForecast)
  const [insight, setInsight]     = useState<ForecastInsight | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [showAdd, setShowAdd]     = useState(false)
  const isManagerOrAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER"

  // Load today's real forecast entries; fall back to mock if empty
  useEffect(() => {
    getForecastEntries(todayStr()).then((entries) => {
      if (entries.length > 0) {
        setData(entries.sort((a, b) => a.time.localeCompare(b.time)))
      }
    })
  }, [])

  const handleInsight = async () => {
    setLoading(true); setError("")
    try {
      const result = await getForecastInsight(data)
      setInsight(result)
    } catch (e: any) {
      setError(e.message || "Failed to get insight")
    } finally { setLoading(false) }
  }

  const reload = async () => {
    const entries = await getForecastEntries(todayStr())
    if (entries.length > 0) setData(entries.sort((a, b) => a.time.localeCompare(b.time)))
  }

  const lunchPeak = Math.max(...data.filter((d) => d.time >= "12:00" && d.time <= "14:00").map((d) => d.predicted), 0)
  const dinnerPeak = Math.max(...data.filter((d) => d.time >= "18:00" && d.time <= "21:00").map((d) => d.predicted), 0)
  const total = data.reduce((s, d) => s + d.predicted, 0)

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Predicted Customer Footfall</CardTitle>
            <CardDescription>Today's covers — predicted vs historical</CardDescription>
          </div>
          <div className="flex gap-2">
            {isManagerOrAdmin && (
              <button onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-medium transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Entry
              </button>
            )}
            <button onClick={handleInsight} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold disabled:opacity-60 transition-colors">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI Insight
            </button>
          </div>
        </div>
        {showAdd && isManagerOrAdmin && (
          <AddEntryForm onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); reload() }} />
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e1e2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f4f4f5",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
              <ReferenceLine x="13:00" stroke="#a78bfa" strokeDasharray="5 5"
                label={{ value: "Lunch", fill: "#a78bfa", fontSize: 11 }} />
              <ReferenceLine x="20:00" stroke="#a78bfa" strokeDasharray="5 5"
                label={{ value: "Dinner", fill: "#a78bfa", fontSize: 11 }} />
              <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2.5}
                dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} name="Predicted" />
              <Line type="monotone" dataKey="historical" stroke="#22d3ee" strokeWidth={2}
                strokeDasharray="5 5" dot={{ r: 2, fill: "#22d3ee" }} name="Historical Avg" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI insight */}
        {error && (
          <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-500">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{error}
          </div>
        )}
        {insight && (
          <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
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
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{insight.staffingAlert}
              </div>
            )}
          </div>
        )}

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Lunch Peak</p>
            <p className="text-xl font-bold">{lunchPeak > 0 ? `~${lunchPeak}` : "—"}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Dinner Peak</p>
            <p className="text-xl font-bold">{dinnerPeak > 0 ? `~${dinnerPeak}` : "—"}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Total Predicted</p>
            <p className="text-xl font-bold">{total > 0 ? total : "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
