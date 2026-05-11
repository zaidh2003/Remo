/**
 * Automation Service for REMO Smart Management System
 * Handles automated workflows and background tasks
 */

import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ShortageAlert, Shift, UserProfile } from "@/lib/types"
import { sendNotification } from "./data-service"

/**
 * Auto-escalate shortage alerts that haven't been filled within a time threshold
 * Runs periodically (e.g., every 5 minutes via cron job or Cloud Function)
 */
export async function autoEscalateUnfilledAlerts(thresholdMinutes: number = 30): Promise<number> {
  const now = new Date()
  const thresholdTime = new Date(now.getTime() - thresholdMinutes * 60 * 1000)
  
  const alertsSnap = await getDocs(
    query(
      collection(db, "shortageAlerts"),
      where("status", "==", "OPEN"),
      where("priority", "==", "NORMAL")
    )
  )
  
  let escalatedCount = 0
  
  for (const alertDoc of alertsSnap.docs) {
    const alert = { id: alertDoc.id, ...alertDoc.data() } as ShortageAlert
    const createdAt = alert.createdAt?.toDate?.() || new Date(0)
    
    // If alert is older than threshold and still NORMAL priority, escalate to HIGH
    if (createdAt < thresholdTime) {
      await updateDoc(doc(db, "shortageAlerts", alert.id), {
        priority: "HIGH",
        reason: `⚠️ ESCALATED: ${alert.reason}`,
      })
      
      // Send notification about escalation
      await sendNotification(
        "all",
        "🚨 Alert Escalated to HIGH Priority",
        `Shortage alert for ${alert.zone} on ${alert.date} has been escalated due to no response.`,
        "shortage"
      )
      
      escalatedCount++
    }
  }
  
  return escalatedCount
}

/**
 * Auto-cancel shortage alerts that are past their time window
 * Runs periodically to clean up old alerts
 */
export async function autoCancelExpiredAlerts(): Promise<number> {
  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  
  const alertsSnap = await getDocs(
    query(
      collection(db, "shortageAlerts"),
      where("status", "==", "OPEN")
    )
  )
  
  let cancelledCount = 0
  
  for (const alertDoc of alertsSnap.docs) {
    const alert = { id: alertDoc.id, ...alertDoc.data() } as ShortageAlert
    
    // Check if alert date is in the past, or if same day but time has passed
    const isPastDate = alert.date < today
    const isSameDayPastTime = alert.date === today && alert.endTime < currentTime
    
    if (isPastDate || isSameDayPastTime) {
      await updateDoc(doc(db, "shortageAlerts", alert.id), {
        status: "CANCELLED",
        reason: `${alert.reason} (Auto-cancelled: time expired)`,
      })
      
      cancelledCount++
    }
  }
  
  return cancelledCount
}

/**
 * Auto-notify employees about upcoming shifts (24 hours before)
 * Runs daily to send shift reminders
 */
export async function autoSendShiftReminders(): Promise<number> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDate = tomorrow.toISOString().split("T")[0]
  
  const shiftsSnap = await getDocs(
    query(
      collection(db, "shifts"),
      where("date", "==", tomorrowDate),
      where("status", "==", "upcoming")
    )
  )
  
  let notificationsSent = 0
  
  for (const shiftDoc of shiftsSnap.docs) {
    const shift = { id: shiftDoc.id, ...shiftDoc.data() } as Shift
    
    if (shift.staffId && shift.staffName) {
      await sendNotification(
        shift.staffId,
        "📅 Shift Reminder",
        `You have a shift tomorrow (${shift.day}) at ${shift.zone} from ${shift.startTime} to ${shift.endTime}.`,
        "scheduler"
      )
      
      notificationsSent++
    }
  }
  
  return notificationsSent
}

/**
 * Auto-mark completed shifts as "completed" status
 * Runs hourly to update shift statuses
 */
export async function autoUpdateShiftStatuses(): Promise<number> {
  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  
  const shiftsSnap = await getDocs(
    query(
      collection(db, "shifts"),
      where("status", "==", "upcoming")
    )
  )
  
  let updatedCount = 0
  
  for (const shiftDoc of shiftsSnap.docs) {
    const shift = { id: shiftDoc.id, ...shiftDoc.data() } as Shift
    
    // Check if shift has ended (past date or same day past end time)
    const isPastDate = shift.day < today
    const isSameDayEnded = shift.day === today && shift.endTime < currentTime
    
    if (isPastDate || isSameDayEnded) {
      await updateDoc(doc(db, "shifts", shift.id), {
        status: "completed",
      })
      
      updatedCount++
    }
  }
  
  return updatedCount
}

/**
 * Auto-detect and alert about understaffed shifts
 * Analyzes upcoming shifts and creates alerts if staffing is below threshold
 */
export async function autoDetectUnderstaffedShifts(daysAhead: number = 3): Promise<number> {
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  const shiftsSnap = await getDocs(
    query(
      collection(db, "shifts"),
      where("status", "==", "vacant")
    )
  )
  
  let alertsCreated = 0
  
  for (const shiftDoc of shiftsSnap.docs) {
    const shift = { id: shiftDoc.id, ...shiftDoc.data() } as Shift
    const shiftDate = new Date(shift.day)
    
    // Only alert for shifts within the next X days
    if (shiftDate >= today && shiftDate <= futureDate) {
      // Check if alert already exists for this shift
      const existingAlertSnap = await getDocs(
        query(
          collection(db, "shortageAlerts"),
          where("date", "==", shift.day),
          where("zone", "==", shift.zone),
          where("startTime", "==", shift.startTime),
          where("status", "==", "OPEN")
        )
      )
      
      // Only create alert if one doesn't exist
      if (existingAlertSnap.empty) {
        await addDoc(collection(db, "shortageAlerts"), {
          createdBy: "system",
          createdByName: "Auto-Detection System",
          branchId: shift.branchId,
          branchName: shift.branchId,
          zone: shift.zone,
          date: shift.day,
          startTime: shift.startTime,
          endTime: shift.endTime,
          reason: `🤖 Auto-detected vacant shift at ${shift.zone}`,
          priority: "NORMAL",
          status: "OPEN",
          createdAt: serverTimestamp(),
        })
        
        await sendNotification(
          "all",
          "⚠️ Understaffed Shift Detected",
          `Vacant shift detected for ${shift.zone} on ${shift.day} from ${shift.startTime} to ${shift.endTime}.`,
          "shortage"
        )
        
        alertsCreated++
      }
    }
  }
  
  return alertsCreated
}

/**
 * Auto-suggest shift swaps based on employee preferences and availability
 * Analyzes patterns and suggests optimal swaps
 */
export async function autoSuggestShiftSwaps(): Promise<number> {
  // This is a placeholder for future ML-based swap suggestions
  // Would analyze:
  // - Employee availability patterns
  // - Historical swap requests
  // - Skill compatibility
  // - Commute distance
  
  console.log("Auto-suggest shift swaps: Feature coming soon")
  return 0
}

/**
 * Auto-archive old completed shifts and alerts
 * Runs weekly to clean up database
 */
export async function autoArchiveOldRecords(daysOld: number = 30): Promise<{ shifts: number; alerts: number }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)
  const cutoffDateStr = cutoffDate.toISOString().split("T")[0]
  
  // Archive old completed shifts
  const shiftsSnap = await getDocs(
    query(
      collection(db, "shifts"),
      where("status", "==", "completed"),
      where("day", "<", cutoffDateStr)
    )
  )
  
  let archivedShifts = 0
  for (const shiftDoc of shiftsSnap.docs) {
    await updateDoc(doc(db, "shifts", shiftDoc.id), {
      archived: true,
      archivedAt: serverTimestamp(),
    })
    archivedShifts++
  }
  
  // Archive old filled/cancelled alerts
  const alertsSnap = await getDocs(
    query(
      collection(db, "shortageAlerts"),
      where("date", "<", cutoffDateStr)
    )
  )
  
  let archivedAlerts = 0
  for (const alertDoc of alertsSnap.docs) {
    const alert = alertDoc.data() as ShortageAlert
    if (alert.status === "FILLED" || alert.status === "CANCELLED") {
      await updateDoc(doc(db, "shortageAlerts", alertDoc.id), {
        archived: true,
        archivedAt: serverTimestamp(),
      })
      archivedAlerts++
    }
  }
  
  return { shifts: archivedShifts, alerts: archivedAlerts }
}

/**
 * Master automation runner - runs all automation tasks
 * Can be called from a cron job or Cloud Function
 */
export async function runAllAutomations(): Promise<{
  escalated: number
  cancelled: number
  reminders: number
  statusUpdates: number
  understaffedAlerts: number
  archived: { shifts: number; alerts: number }
}> {
  console.log("🤖 Running all automations...")
  
  const [escalated, cancelled, reminders, statusUpdates, understaffedAlerts, archived] = await Promise.all([
    autoEscalateUnfilledAlerts(30),
    autoCancelExpiredAlerts(),
    autoSendShiftReminders(),
    autoUpdateShiftStatuses(),
    autoDetectUnderstaffedShifts(3),
    autoArchiveOldRecords(30),
  ])
  
  console.log("✅ Automations complete:", {
    escalated,
    cancelled,
    reminders,
    statusUpdates,
    understaffedAlerts,
    archived,
  })
  
  return {
    escalated,
    cancelled,
    reminders,
    statusUpdates,
    understaffedAlerts,
    archived,
  }
}
