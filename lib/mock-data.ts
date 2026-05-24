import type { Staff, Shift, Task, ForecastData, InventoryItem } from "./types"

export const staffData: any[] = [
  { id: "1", name: "Sarah Chen", role: "Chef", skillLevel: 5, hourlyRate: 28, availability: "available", avatar: "SC", constraints: "Cannot work past 10 PM" },
  { id: "2", name: "Marcus Johnson", role: "Server", skillLevel: 4, hourlyRate: 18, availability: "busy", avatar: "MJ" },
  { id: "3", name: "Emily Rodriguez", role: "Inventory Specialist", skillLevel: 4, hourlyRate: 22, availability: "available", avatar: "ER" },
  { id: "4", name: "David Kim", role: "Chef", skillLevel: 5, hourlyRate: 30, availability: "off", avatar: "DK", constraints: "Only available weekends" },
  { id: "5", name: "Lisa Thompson", role: "Server", skillLevel: 3, hourlyRate: 16, availability: "available", avatar: "LT" },
  { id: "6", name: "James Wilson", role: "Manager", skillLevel: 5, hourlyRate: 35, availability: "busy", avatar: "JW" },
  { id: "7", name: "Anna Martinez", role: "Host", skillLevel: 4, hourlyRate: 17, availability: "available", avatar: "AM" },
  { id: "8", name: "Michael Brown", role: "Chef", skillLevel: 4, hourlyRate: 26, availability: "available", avatar: "MB" },
]

export const initialShifts: any[] = [
  { id: "1", staffId: "1", staffName: "Sarah Chen", role: "Chef", day: "Monday", startTime: "11:00", endTime: "19:00", status: "optimal" },
  { id: "2", staffId: "2", staffName: "Marcus Johnson", role: "Server", day: "Monday", startTime: "10:00", endTime: "18:00", status: "optimal" },
  { id: "3", staffId: "5", staffName: "Lisa Thompson", role: "Server", day: "Monday", startTime: "16:00", endTime: "23:00", status: "understaffed" },
  { id: "4", staffId: "8", staffName: "Michael Brown", role: "Chef", day: "Tuesday", startTime: "10:00", endTime: "20:00", status: "overworked" },
  { id: "5", staffId: "3", staffName: "Emily Rodriguez", role: "Inventory Specialist", day: "Tuesday", startTime: "08:00", endTime: "16:00", status: "optimal" },
  { id: "6", staffId: "7", staffName: "Anna Martinez", role: "Host", day: "Wednesday", startTime: "17:00", endTime: "23:00", status: "optimal" },
  { id: "7", staffId: "1", staffName: "Sarah Chen", role: "Chef", day: "Wednesday", startTime: "11:00", endTime: "19:00", status: "optimal" },
  { id: "8", staffId: "2", staffName: "Marcus Johnson", role: "Server", day: "Thursday", startTime: "10:00", endTime: "18:00", status: "understaffed" },
  { id: "9", staffId: "6", staffName: "James Wilson", role: "Manager", day: "Friday", startTime: "09:00", endTime: "21:00", status: "overworked" },
  { id: "10", staffId: "5", staffName: "Lisa Thompson", role: "Server", day: "Friday", startTime: "16:00", endTime: "23:00", status: "optimal" },
  { id: "11", staffId: "8", staffName: "Michael Brown", role: "Chef", day: "Saturday", startTime: "10:00", endTime: "22:00", status: "overworked" },
  { id: "12", staffId: "4", staffName: "David Kim", role: "Chef", day: "Saturday", startTime: "11:00", endTime: "21:00", status: "optimal" },
  { id: "13", staffId: "7", staffName: "Anna Martinez", role: "Host", day: "Sunday", startTime: "11:00", endTime: "20:00", status: "optimal" },
  { id: "14", staffId: "3", staffName: "Emily Rodriguez", role: "Inventory Specialist", day: "Sunday", startTime: "08:00", endTime: "14:00", status: "optimal" },
]

export const initialTasks: Task[] = [
  { id: "1", title: "Prep vegetables for lunch service", category: "Preparation", priority: "high", assignedTo: "Sarah Chen", timeWindow: "9:00 - 11:00", zone: "Kitchen" },
  { id: "2", title: "Marinate proteins", category: "Preparation", priority: "high", timeWindow: "8:00 - 10:00", zone: "Kitchen" },
  { id: "3", title: "Prepare sauces", category: "Cooking", priority: "medium", assignedTo: "Michael Brown", timeWindow: "10:00 - 11:30", zone: "Kitchen" },
  { id: "4", title: "Set up dining room", category: "Serving", priority: "medium", assignedTo: "Marcus Johnson", timeWindow: "10:30 - 11:00", zone: "Dining" },
  { id: "5", title: "Restock condiments", category: "Serving", priority: "low", timeWindow: "14:00 - 15:00", zone: "Dining" },
  { id: "6", title: "Deep clean fryers", category: "Cleaning", priority: "medium", timeWindow: "15:00 - 16:00", zone: "Kitchen" },
  { id: "7", title: "Sanitize prep stations", category: "Cleaning", priority: "high", timeWindow: "23:00 - 00:00", zone: "Kitchen" },
  { id: "8", title: "Count dry goods", category: "Inventory Management", priority: "medium", assignedTo: "Emily Rodriguez", timeWindow: "08:00 - 09:00", zone: "Storage" },
  { id: "9", title: "Order produce", category: "Inventory Management", priority: "high", timeWindow: "09:00 - 10:00", zone: "Office" },
  { id: "10", title: "Check refrigerator temps", category: "Inventory Management", priority: "high", assignedTo: "Emily Rodriguez", timeWindow: "07:00 - 07:30", zone: "Kitchen" },
]

export const forecastData: ForecastData[] = [
  { time: "11:00", predicted: 25, historical: 22 },
  { time: "12:00", predicted: 85, historical: 78 },
  { time: "13:00", predicted: 95, historical: 92 },
  { time: "14:00", predicted: 60, historical: 55 },
  { time: "15:00", predicted: 30, historical: 28 },
  { time: "16:00", predicted: 20, historical: 18 },
  { time: "17:00", predicted: 35, historical: 32 },
  { time: "18:00", predicted: 75, historical: 70 },
  { time: "19:00", predicted: 110, historical: 105 },
  { time: "20:00", predicted: 120, historical: 115 },
  { time: "21:00", predicted: 90, historical: 88 },
  { time: "22:00", predicted: 45, historical: 42 },
]

export const inventoryItems: any[] = [
  { id: "1", name: "Chicken Breast", category: "Proteins", quantity: 45, unit: "lbs", minStock: 50, status: "low" },
  { id: "2", name: "Salmon Fillet", category: "Proteins", quantity: 30, unit: "lbs", minStock: 25, status: "in-stock" },
  { id: "3", name: "Mixed Greens", category: "Produce", quantity: 8, unit: "cases", minStock: 15, status: "critical" },
  { id: "4", name: "Tomatoes", category: "Produce", quantity: 40, unit: "lbs", minStock: 30, status: "in-stock" },
  { id: "5", name: "Olive Oil", category: "Pantry", quantity: 12, unit: "gallons", minStock: 10, status: "in-stock" },
  { id: "6", name: "All-Purpose Flour", category: "Pantry", quantity: 35, unit: "lbs", minStock: 40, status: "low" },
  { id: "7", name: "House Red Wine", category: "Beverages", quantity: 18, unit: "bottles", minStock: 20, status: "low" },
  { id: "8", name: "Sparkling Water", category: "Beverages", quantity: 48, unit: "bottles", minStock: 36, status: "in-stock" },
]

export const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
