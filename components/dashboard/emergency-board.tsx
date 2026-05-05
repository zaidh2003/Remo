"use client"

import React, { useState } from "react"
import { AlertTriangle, Clock, CheckCircle, UserCheck, Sparkles, Loader2 } from "lucide-react"
import { suggestReplacement, type ReplacementSuggestion } from "@/lib/services/groq-service"
import { staffData } from "@/lib/mock-data"
import type { Shift } from "@/lib/types"

// Example vacant emergency shift
const vacantShift: Shift = {
  id: "emergency-1",
  staffId: null,
  staffName: null,
  branchId: "branch-b",
  zone: "Meat",
  day: "Today",
  startTime: "14:00",
  endTime: "20:00",
  isEmergency: true,
  status: "vacant",
}

export function EmergencyBoard() {
  const [accepted, setAccepted] = useState(false)
  const [suggestion, setSuggestion] = useState<ReplacementSuggestion | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState("")

  const handleAISuggest = async () => {
    setLoadingSuggestion(true)
    setSuggestionError("")
    try {
      const available = staffData.filter((s) => s.availability === "available")
      const result = await suggestReplacement(vacantShift, available as any)
      setSuggestion(result)
    } catch (err: any) {
      setSuggestionError("Could not get AI suggestion. Try again.")
    } finally {
      setLoadingSuggestion(false)
    }
  }

  const recommendedStaff = suggestion
    ? staffData.find((s) => s.id === suggestion.recommendedStaffId)
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Emergency Vacancy Card */}
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4 text-red-500">
          <AlertTriangle className="h-10 w-10 shrink-0" />
          <div className="text-left">
            <h3 className="text-xl font-bold">Emergency Vacancy!</h3>
            <p className="text-sm font-medium opacity-80">First Come First Serve — Branch B</p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 flex gap-8 items-center flex-1 w-full max-w-sm justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Zone</p>
            <p className="font-semibold text-foreground">Meat &amp; Grill</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Time</p>
            <p className="font-semibold text-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> 14:00 - 20:00
            </p>
          </div>
        </div>

        {accepted ? (
          <div className="bg-green-500 text-white font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2 w-full md:w-auto">
            <UserCheck className="w-5 h-5" /> Secured by You
          </div>
        ) : (
          <button
            onClick={() => setAccepted(true)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-red-500/40 w-full md:w-auto hover:-translate-y-0.5 transition-all"
          >
            ACCEPT SHIFT
          </button>
        )}
      </div>

      {/* AI Suggestion Panel */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Replacement Suggestion
          </h3>
          <button
            onClick={handleAISuggest}
            disabled={loadingSuggestion}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loadingSuggestion ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Ask Groq</>
            )}
          </button>
        </div>

        {suggestionError && (
          <p className="text-sm text-destructive">{suggestionError}</p>
        )}

        {suggestion && (
          <div className="space-y-4">
            {/* Top pick */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-xs uppercase font-bold text-primary tracking-wider mb-1">Best Match</p>
              <p className="font-semibold text-foreground text-base">
                {recommendedStaff?.name ?? suggestion.recommendedStaffId}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
            </div>

            {/* Alternatives */}
            {suggestion.alternatives?.length > 0 && (
              <div>
                <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Alternatives</p>
                <div className="space-y-2">
                  {suggestion.alternatives.map((alt) => {
                    const altStaff = staffData.find((s) => s.id === alt.staffId)
                    return (
                      <div key={alt.staffId} className="bg-muted/50 rounded-xl p-3 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {altStaff?.avatar ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{altStaff?.name ?? alt.staffId}</p>
                          <p className="text-xs text-muted-foreground">{alt.reason}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!suggestion && !loadingSuggestion && (
          <p className="text-sm text-muted-foreground">
            Click "Ask Groq" to get an AI-powered replacement recommendation based on staff skills and availability.
          </p>
        )}
      </div>

      {/* Pending Shift Swaps */}
      <div className="border-t border-border pt-6">
        <h3 className="text-xl font-bold mb-4">Pending Shift Swaps</h3>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Tom (Fries) wants to swap</h4>
            <p className="text-sm text-muted-foreground">Friday, 18:00 - 23:00</p>
          </div>
          <button className="bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Offer Swap
          </button>
        </div>
      </div>
    </div>
  )
}
