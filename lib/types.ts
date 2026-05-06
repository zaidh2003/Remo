// Updated REMO Smart Management System Types

export type AppRole = "ADMIN" | "MANAGER" | "EMPLOYEE"
export type WorkZone = "Meat" | "Salad" | "Grill" | "Fries" | "Dishwashing" | "Bar" | "Waiter" | "Kitchen" | "Host"
export type SkillLevel = "Beginner" | "Intermediate" | "Expert"
export type AppLanguage = "en" | "ru" | "lt"

export interface WorkerSkill {
  zone: WorkZone
  level: SkillLevel
}

export interface Branch {
  id: string
  name: string
  address?: string
  managerId?: string
  createdAt: any
}

export type ShortageAlertStatus = "OPEN" | "FILLED" | "CANCELLED"
export type ShortageResponseStatus = "PENDING" | "ACCEPTED" | "DENIED"
export type SickLeaveType = "SUDDEN_ILLNESS" | "OTHER"

export interface ShortageAlert {
  id: string
  createdBy: string
  createdByName: string
  branchId: string
  branchName: string
  zone: WorkZone
  date: string
  startTime: string
  endTime: string
  reason: string
  priority: "HIGH" | "NORMAL"           // HIGH for sudden illness
  sickLeaveType?: SickLeaveType          // set when triggered by sick leave
  status: ShortageAlertStatus
  aiSuggestedUid?: string
  aiReason?: string
  createdAt: any
}

export interface ShortageResponse {
  id: string
  alertId: string
  employeeUid: string
  employeeName: string
  status: ShortageResponseStatus
  respondedAt: any
}

export interface Staff {
  id: string
  name: string
  role: AppRole
  branchId: string
  skills: WorkZone[]
  availability: "available" | "busy" | "off"
  avatar: string
  language?: "en" | "ru" | "lt"
}

export interface Shift {
  id: string
  staffId: string | null // null means VACANT
  staffName: string | null
  branchId: string
  zone: WorkZone | string
  day: string
  startTime: string
  endTime: string
  isEmergency: boolean
  status: "upcoming" | "completed" | "vacant" | "swap_requested" | "optimal"
}

export interface TaxiRequest {
  id: string
  staffId: string
  staffName: string
  shiftId: string
  type: "PICKUP" | "DROPOFF"
  status: "PENDING" | "APPROVED" | "REJECTED"
  requestTime: string
}

export interface Task {
  id: string
  title: string
  category: "Preparation" | "Cooking" | "Serving" | "Cleaning" | "Inventory Management"
  priority: "high" | "medium" | "low"
  assignedTo?: string
  timeWindow: string
  zone: string
}

export interface ForecastData {
  time: string
  predicted: number
  historical: number
}

export interface DemandForecast {
  date: string
  lunchPeak: number
  dinnerPeak: number
  predictedCovers: number
  historicalActuals: number
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  status: "in-stock" | "low" | "critical"
}

export type SwapRequestStatus = "PENDING" | "APPROVED_BY_TARGET" | "APPROVED_BY_MANAGER" | "REJECTED"

export interface SwapRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterShiftId: string
  targetId: string
  targetName: string
  targetShiftId: string
  status: SwapRequestStatus
  createdAt: any
  approvedAt?: any
}
