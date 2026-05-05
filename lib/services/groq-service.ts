import type { Shift, Staff, TaxiRequest } from "@/lib/types";

async function callGroq<T>(action: string, payload: object): Promise<T> {
  const res = await fetch("/api/groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.statusText}`);
  const { result, error } = await res.json();
  if (error) throw new Error(error);
  return result as T;
}

// ── 1. Optimise weekly schedule ───────────────────────────────────────────────
export async function optimizeSchedule(
  shifts: Shift[],
  staff: Staff[]
): Promise<Shift[]> {
  return callGroq<Shift[]>("optimize_schedule", { shifts, staff });
}

// ── 2. Suggest best replacement for an emergency vacancy ─────────────────────
export interface ReplacementSuggestion {
  recommendedStaffId: string;
  reason: string;
  alternatives: { staffId: string; reason: string }[];
}

export async function suggestReplacement(
  vacantShift: Shift,
  availableStaff: Staff[]
): Promise<ReplacementSuggestion> {
  return callGroq<ReplacementSuggestion>("suggest_replacement", {
    vacantShift,
    availableStaff,
  });
}

// ── 3. Check taxi eligibility against policy ──────────────────────────────────
export interface TaxiEligibility {
  eligible: boolean;
  reason: string;
}

export async function checkTaxiEligibility(
  request: Pick<TaxiRequest, "type" | "staffId">,
  recentShifts: Shift[]
): Promise<TaxiEligibility> {
  return callGroq<TaxiEligibility>("check_taxi_eligibility", {
    request,
    recentShifts,
  });
}

// ── 5. Match best employee for a shortage alert ───────────────────────────────
export interface ShortageMatch {
  recommendedUid: string;
  reason: string;
}

export async function matchShortage(
  alert: { zone: string; date: string; startTime: string; endTime: string; reason: string; priority?: string },
  employees: { uid: string; name: string; skills: { zone: string; level: string }[] }[]
): Promise<ShortageMatch> {
  return callGroq<ShortageMatch>("match_shortage", { alert, employees });
}
export interface ForecastInsight {
  peakHour: string;
  recommendation: string;
  staffingAlert: string | null;
}

export async function getForecastInsight(
  forecastData: { time: string; predicted: number; historical: number }[]
): Promise<ForecastInsight> {
  return callGroq<ForecastInsight>("forecast_insight", { forecastData });
}
