import { NextRequest, NextResponse } from "next/server"
import { runAllAutomations } from "@/lib/services/automation-service"

/**
 * API endpoint to trigger automation tasks
 * Can be called manually or via cron job (e.g., Vercel Cron, GitHub Actions)
 * 
 * Usage:
 * POST /api/automation
 * Headers: { "Authorization": "Bearer YOUR_SECRET_KEY" }
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for production
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.AUTOMATION_SECRET_KEY
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Run all automation tasks
    const results = await runAllAutomations()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error("Automation error:", error)
    return NextResponse.json(
      { 
        error: "Automation failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check automation status
 */
export async function GET() {
  return NextResponse.json({
    status: "ready",
    message: "Automation service is running",
    timestamp: new Date().toISOString(),
  })
}
