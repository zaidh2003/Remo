import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/lib/firebase-admin";
import crypto from "crypto";

// Validate key at startup so failures are obvious
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("[Groq] GROQ_API_KEY is not set. Restart the dev server after adding it to .env.local");
}

const groq = new Groq({ apiKey: apiKey ?? "missing" });

// Cache configuration
const CACHE_TTL_MINUTES = {
  optimize_schedule: 30,      // Schedule optimization valid for 30 min
  suggest_replacement: 15,    // Replacement suggestions valid for 15 min
  check_taxi_eligibility: 60, // Taxi eligibility valid for 1 hour
  forecast_insight: 120,      // Forecast insights valid for 2 hours
  match_shortage: 15,         // Shortage matching valid for 15 min
};

/**
 * Generate a cache key from action and payload
 */
function generateCacheKey(action: string, payload: any): string {
  const payloadStr = JSON.stringify(payload);
  const hash = crypto.createHash("sha256").update(payloadStr).digest("hex");
  return `${action}_${hash}`;
}

/**
 * Check Firestore cache for a valid cached response
 */
async function getCachedResponse(cacheKey: string, ttlMinutes: number): Promise<any | null> {
  try {
    const firestore = db();
    const cacheRef = firestore.collection("aiCache").doc(cacheKey);
    const cacheDoc = await cacheRef.get();
    
    if (!cacheDoc.exists) {
      return null;
    }
    
    const cacheData = cacheDoc.data();
    const cachedAt = cacheData?.cachedAt?.toDate();
    const now = new Date();
    
    if (!cachedAt) {
      return null;
    }
    
    const ageMinutes = (now.getTime() - cachedAt.getTime()) / (1000 * 60);
    
    if (ageMinutes > ttlMinutes) {
      // Cache expired, delete it
      await cacheRef.delete();
      return null;
    }
    
    if (!cacheData) return null;
    console.log(`[Groq Cache] HIT for ${cacheKey} (age: ${ageMinutes.toFixed(1)}m)`);
    return cacheData.result;
  } catch (error) {
    console.error("[Groq Cache] Error reading cache:", error);
    return null;
  }
}

/**
 * Store response in Firestore cache
 */
async function setCachedResponse(cacheKey: string, result: any): Promise<void> {
  try {
    const firestore = db();
    const cacheRef = firestore.collection("aiCache").doc(cacheKey);
    await cacheRef.set({
      result,
      cachedAt: new Date(),
    });
    console.log(`[Groq Cache] STORED ${cacheKey}`);
  } catch (error) {
    console.error("[Groq Cache] Error storing cache:", error);
  }
}

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured. Restart the dev server after adding it to .env.local" },
      { status: 500 }
    );
  }
  try {
    const { action, payload } = await req.json();

    // Generate cache key
    const cacheKey = generateCacheKey(action, payload);
    const ttlMinutes = CACHE_TTL_MINUTES[action as keyof typeof CACHE_TTL_MINUTES] || 30;

    // Check cache first
    const cachedResult = await getCachedResponse(cacheKey, ttlMinutes);
    if (cachedResult) {
      return NextResponse.json({ result: cachedResult, cached: true });
    }

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
        const { vacantShift, availableStaff, aiWeights } = payload;
        const weights = aiWeights || {
          skillMatch: 40,
          proficiency: 25,
          workload: 20,
          proximity: 10,
          experience: 5,
        };
        systemPrompt = `You are a restaurant operations assistant.
Given a vacant emergency shift and a list of available staff, suggest the best replacement.
Use these weighted criteria (total 100%):
- Skill/zone matching: ${weights.skillMatch}%
- Proficiency level: ${weights.proficiency}%
- Current workload: ${weights.workload}%
- Branch proximity: ${weights.proximity}%
- Recent zone experience: ${weights.experience}%
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
        const { alert, employees, aiWeights } = payload;
        const weights = aiWeights || {
          skillMatch: 40,
          proficiency: 25,
          workload: 20,
          proximity: 10,
          experience: 5,
        };
        systemPrompt = `You are a restaurant staffing assistant.
Given a shortage alert (zone, time, date, priority) and a list of employees with their skills and proficiency levels,
suggest the single best employee to fill the gap.
Use these weighted criteria (total 100%):
- Skill/zone matching: ${weights.skillMatch}%
- Proficiency level: ${weights.proficiency}%
- Current workload: ${weights.workload}%
- Branch proximity: ${weights.proximity}%
- Recent zone experience: ${weights.experience}%
For HIGH priority alerts, only suggest Expert or Intermediate workers.
Return JSON: { "recommendedUid": string, "reason": string }
Only return valid JSON — no markdown, no explanation.`;
        userPrompt = `Shortage alert: ${JSON.stringify(alert)}\nEmployees: ${JSON.stringify(employees)}`;
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    console.log(`[Groq Cache] MISS for ${cacheKey}, calling API...`);

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

    // Store in cache
    await setCachedResponse(cacheKey, result);

    return NextResponse.json({ result, cached: false });
  } catch (err: any) {
    console.error("[Groq API]", err);
    return NextResponse.json({ error: err.message ?? "Groq request failed" }, { status: 500 });
  }
}
