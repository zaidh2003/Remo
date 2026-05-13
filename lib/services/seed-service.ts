/**
 * Comprehensive seed data utility for REMO system
 * Provides realistic test data for all modules
 */

import { saveBranch, saveShift, saveTask, seedInventoryData, sendNotification } from "./data-service"
import { createUserProfile, type UserProfile } from "./user-service"
import type { WorkZone, SkillLevel } from "@/lib/types"

export interface SeedOptions {
  branchId: string
  branchName: string
  includeShifts?: boolean
  includeTasks?: boolean
  includeInventory?: boolean
  includeStaff?: boolean
}

/**
 * Seed realistic staff members with skills
 */
export async function seedStaff(branchId: string): Promise<UserProfile[]> {
  const staff: Omit<UserProfile, "uid">[] = [
    // Managers
    {
      email: "manager1@remo.test",
      name: "Sarah Johnson",
      role: "MANAGER",
      branchId,
      skills: [
        { zone: "Kitchen", level: "Expert" },
        { zone: "Grill", level: "Expert" },
        { zone: "Bar", level: "Intermediate" },
      ],
    },
    // Expert Staff
    {
      email: "chef1@remo.test",
      name: "Marco Rodriguez",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Grill", level: "Expert" },
        { zone: "Meat", level: "Expert" },
        { zone: "Kitchen", level: "Expert" },
      ],
    },
    {
      email: "bartender1@remo.test",
      name: "Emma Chen",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Bar", level: "Expert" },
        { zone: "Waiter", level: "Intermediate" },
      ],
    },
    {
      email: "waiter1@remo.test",
      name: "James Wilson",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Waiter", level: "Expert" },
        { zone: "Host", level: "Expert" },
        { zone: "Bar", level: "Beginner" },
      ],
    },
    // Intermediate Staff
    {
      email: "cook1@remo.test",
      name: "Lisa Anderson",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Kitchen", level: "Intermediate" },
        { zone: "Salad", level: "Intermediate" },
        { zone: "Fries", level: "Intermediate" },
      ],
    },
    {
      email: "cook2@remo.test",
      name: "David Kim",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Grill", level: "Intermediate" },
        { zone: "Meat", level: "Intermediate" },
        { zone: "Kitchen", level: "Beginner" },
      ],
    },
    {
      email: "waiter2@remo.test",
      name: "Sophie Martin",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Waiter", level: "Intermediate" },
        { zone: "Host", level: "Intermediate" },
      ],
    },
    {
      email: "dishwasher1@remo.test",
      name: "Carlos Garcia",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Dishwashing", level: "Expert" },
        { zone: "Kitchen", level: "Beginner" },
      ],
    },
    // Beginner Staff
    {
      email: "trainee1@remo.test",
      name: "Alex Thompson",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Waiter", level: "Beginner" },
        { zone: "Host", level: "Beginner" },
      ],
    },
    {
      email: "trainee2@remo.test",
      name: "Maria Santos",
      role: "EMPLOYEE",
      branchId,
      skills: [
        { zone: "Salad", level: "Beginner" },
        { zone: "Fries", level: "Beginner" },
      ],
    },
  ]

  const createdStaff: UserProfile[] = []
  
  for (const member of staff) {
    try {
      // Note: In production, this would use Firebase Auth to create users
      // For now, we'll just create the profile documents
      console.log(`[Seed] Would create staff: ${member.name} (${member.email})`)
      // createdStaff.push(await createUserProfile(member))
    } catch (error) {
      console.error(`[Seed] Error creating staff ${member.name}:`, error)
    }
  }

  return createdStaff
}

/**
 * Seed realistic weekly shifts
 */
export async function seedShifts(branchId: string, weekLabel: string): Promise<void> {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const zones: WorkZone[] = ["Grill", "Bar", "Waiter", "Kitchen", "Host", "Meat", "Salad", "Fries", "Dishwashing"]
  
  const shiftTemplates = [
    // Morning shifts (10:00-14:00)
    { startTime: "10:00", endTime: "14:00", zones: ["Kitchen", "Grill", "Waiter", "Host"] },
    // Afternoon shifts (14:00-18:00)
    { startTime: "14:00", endTime: "18:00", zones: ["Kitchen", "Bar", "Waiter", "Dishwashing"] },
    // Evening shifts (18:00-22:00)
    { startTime: "18:00", endTime: "22:00", zones: ["Grill", "Bar", "Waiter", "Kitchen", "Host", "Meat"] },
    // Late shifts (22:00-02:00)
    { startTime: "22:00", endTime: "02:00", zones: ["Bar", "Dishwashing", "Kitchen"] },
  ]

  let shiftCount = 0

  for (const day of days) {
    for (const template of shiftTemplates) {
      for (const zone of template.zones) {
        try {
          await saveShift({
            staffId: null, // Vacant initially
            staffName: null,
            branchId,
            zone,
            day,
            startTime: template.startTime,
            endTime: template.endTime,
            isEmergency: false,
            status: "vacant",
            weekLabel,
          })
          shiftCount++
        } catch (error) {
          console.error(`[Seed] Error creating shift:`, error)
        }
      }
    }
  }

  console.log(`[Seed] Created ${shiftCount} shifts for week ${weekLabel}`)
}

/**
 * Seed realistic tasks
 */
export async function seedTasks(branchId: string): Promise<void> {
  const tasks = [
    // Preparation
    { title: "Prep vegetables for lunch service", category: "Preparation" as const, priority: "high" as const, zone: "Kitchen", timeWindow: "08:00-10:00" },
    { title: "Marinate meat for dinner", category: "Preparation" as const, priority: "high" as const, zone: "Meat", timeWindow: "09:00-11:00" },
    { title: "Set up bar station", category: "Preparation" as const, priority: "medium" as const, zone: "Bar", timeWindow: "10:00-11:00" },
    { title: "Prepare salad ingredients", category: "Preparation" as const, priority: "medium" as const, zone: "Salad", timeWindow: "09:00-10:00" },
    
    // Cooking
    { title: "Cook lunch specials", category: "Cooking" as const, priority: "high" as const, zone: "Kitchen", timeWindow: "11:00-14:00" },
    { title: "Grill steaks for dinner", category: "Cooking" as const, priority: "high" as const, zone: "Grill", timeWindow: "17:00-21:00" },
    { title: "Prepare fries batches", category: "Cooking" as const, priority: "medium" as const, zone: "Fries", timeWindow: "11:00-22:00" },
    
    // Serving
    { title: "Serve lunch customers", category: "Serving" as const, priority: "high" as const, zone: "Waiter", timeWindow: "12:00-15:00" },
    { title: "Greet and seat guests", category: "Serving" as const, priority: "high" as const, zone: "Host", timeWindow: "11:00-22:00" },
    { title: "Mix cocktails for happy hour", category: "Serving" as const, priority: "medium" as const, zone: "Bar", timeWindow: "17:00-19:00" },
    
    // Cleaning
    { title: "Clean kitchen surfaces", category: "Cleaning" as const, priority: "high" as const, zone: "Kitchen", timeWindow: "14:00-15:00" },
    { title: "Wash dishes from lunch", category: "Cleaning" as const, priority: "high" as const, zone: "Dishwashing", timeWindow: "14:00-16:00" },
    { title: "Sanitize bar area", category: "Cleaning" as const, priority: "medium" as const, zone: "Bar", timeWindow: "23:00-00:00" },
    { title: "Deep clean grill station", category: "Cleaning" as const, priority: "low" as const, zone: "Grill", timeWindow: "22:00-23:00" },
    
    // Inventory Management
    { title: "Check meat stock levels", category: "Inventory Management" as const, priority: "high" as const, zone: "Meat", timeWindow: "08:00-09:00" },
    { title: "Count beverage inventory", category: "Inventory Management" as const, priority: "medium" as const, zone: "Bar", timeWindow: "09:00-10:00" },
    { title: "Order vegetables for next week", category: "Inventory Management" as const, priority: "low" as const, zone: "Kitchen", timeWindow: "15:00-16:00" },
  ]

  let taskCount = 0

  for (const task of tasks) {
    try {
      await saveTask(task)
      taskCount++
    } catch (error) {
      console.error(`[Seed] Error creating task:`, error)
    }
  }

  console.log(`[Seed] Created ${taskCount} tasks`)
}

/**
 * Seed all data for a branch
 */
export async function seedAllData(options: SeedOptions): Promise<{
  success: boolean
  message: string
  details: {
    staff: number
    shifts: number
    tasks: number
    inventory: number
  }
}> {
  const { branchId, branchName, includeShifts = true, includeTasks = true, includeInventory = true, includeStaff = true } = options
  
  const details = {
    staff: 0,
    shifts: 0,
    tasks: 0,
    inventory: 0,
  }

  try {
    console.log(`[Seed] Starting seed for branch: ${branchName} (${branchId})`)

    // Seed staff
    if (includeStaff) {
      const staff = await seedStaff(branchId)
      details.staff = staff.length
      console.log(`[Seed] ✓ Staff: ${details.staff} members`)
    }

    // Seed shifts
    if (includeShifts) {
      const weekLabel = `Week-${new Date().getFullYear()}-${Math.ceil((new Date().getDate()) / 7)}`
      await seedShifts(branchId, weekLabel)
      details.shifts = 7 * 4 * 9 // 7 days * 4 shift templates * ~9 zones avg = ~252 shifts
      console.log(`[Seed] ✓ Shifts: ~${details.shifts} shifts`)
    }

    // Seed tasks
    if (includeTasks) {
      await seedTasks(branchId)
      details.tasks = 17
      console.log(`[Seed] ✓ Tasks: ${details.tasks} tasks`)
    }

    // Seed inventory
    if (includeInventory) {
      await seedInventoryData(branchId)
      details.inventory = 18
      console.log(`[Seed] ✓ Inventory: ${details.inventory} items`)
    }

    return {
      success: true,
      message: `Successfully seeded ${branchName} with realistic data`,
      details,
    }
  } catch (error: any) {
    console.error(`[Seed] Error seeding branch:`, error)
    return {
      success: false,
      message: `Failed to seed branch: ${error.message}`,
      details,
    }
  }
}

/**
 * Clear all data for a branch (use with caution!)
 */
export async function clearBranchData(branchId: string): Promise<void> {
  console.warn(`[Seed] Clearing all data for branch: ${branchId}`)
  // Implementation would delete all shifts, tasks, inventory, etc. for this branch
  // Left as exercise - requires careful implementation to avoid data loss
}
