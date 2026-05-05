import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// Validate key at startup so failures are obvious
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("[Groq] GROQ_API_KEY is not set. Restart the dev server after adding it to .env.local");
}

const groq = new Groq({ apiKey: apiKey ?? "missing" });

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured. Restart the dev server after adding it to .env.local" },
      { status: 500 }
    );
  }
  try {
    const { action, payload } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      // ── 1. Schedule optimisation ──────────────────────────────────────────
      case "optimize_schedule": {
        const { shifts, staff } = payload;
        systemPrompt = `You are an expert restaurant workforce scheduler.
Analyse the provided shifts and staff data, then return a JSON array of shift objects with an updated "status" field.
Rules:
- "optimal"     → shift is well-covered
- "understaffed"→ not enough skilled workers for that zone/time
- "overworked"  → worker exceeds 10 h/day or 50 h/week
Only return valid JSON — no markdown, no explanation.`;
        userPrompt = `Staff: ${JSON.stringify(staff)}\nShifts: ${JSON.stringify(shifts)}`;
        break;
      }

      // ── 2. Emergency replacement suggestion ──────────────────────────────
      case "suggest_replacement": {
        const { vacantShift, availableStaff } = payload;
        systemPrompt = `You are a restaurant operations assistant.
Given a vacant emergency shift and a list of available staff, suggest the best replacement.
Consider: matching skills/zones, current workload, branch proximity.
Return JSON: { "recommendedStaffId": string, "reason": string, "alternatives": [{staffId, reason}] }
Only return valid JSON — no markdown, no explanation.`;
        userPrompt = `Vacant shift: ${JSON.stringify(vacantShift)}\nAvailable staff: ${JSON.stringify(availableStaff)}`;
        break;
      }

      // ── 3. Taxi eligibility check ─────────────────────────────────────────
      case "check_taxi_eligibility": {
        const { request, recentShifts } = payload;
        systemPrompt = `You are a restaurant transport policy enforcer.
Rules:
- PICKUP is allowed ONLY if the worker accepted an emergency shift today.
- DROPOFF is allowed ONLY if the worker's shift ends at or after 22:00.
Return JSON: { "eligible": boolean, "reason": string }
Only return valid JSON — no markdown, no explanation.`;
        userPrompt = `Taxi request: ${JSON.stringify(request)}\nWorker's recent shifts today: ${JSON.stringify(recentShifts)}`;
        break;
      }

      // ── 4. Demand forecast insight ────────────────────────────────────────
      case "forecast_insight": {
        const { forecastData } = payload;
        systemPrompt = `You are a restaurant demand analyst.
Given hourly predicted vs historical cover data, return a short actionable insight.
Return JSON: { "peakHour": string, "recommendation": string, "staffingAlert": string | null }
Only return valid JSON — no markdown, no explanation.`;
        userPrompt = `Forecast data: ${JSON.stringify(forecastData)}`;
        break;
      }

      // ── 5. Shortage alert — best employee match ───────────────────────────
      case "match_shortage": {
        const { alert, employees } = payload;
        systemPrompt = `You are a restaurant staffing assistant.
Given a shortage alert (zone, time, date, priority) and a list of employees with their skills and proficiency levels,
suggest the single best employee to fill the gap.
Consider: matching skills to the required zone, prioritise Expert > Intermediate > Beginner, availability.
For HIGH priority alerts, only suggest Expert or Intermediate workers.
Return JSON: { "recommendedUid": string, "reason": string }
Only return valid JSON — no markdown, no explanation.`;
        userPrompt = `Shortage alert: ${JSON.stringify(alert)}\nEmployees: ${JSON.stringify(employees)}`;
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("[Groq API]", err);
    return NextResponse.json({ error: err.message ?? "Groq request failed" }, { status: 500 });
  }
}
