/**
 * Firestore services for: Shifts, Tasks, Inventory, Forecast entries
 */
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, serverTimestamp,
  runTransaction, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Shift, Task, InventoryItem, ForecastData } from "@/lib/types";

// ── SHIFTS ────────────────────────────────────────────────────────────────────

export async function getShifts(weekLabel?: string): Promise<Shift[]> {
  const q = weekLabel
    ? query(collection(db, "shifts"), where("weekLabel", "==", weekLabel))
    : query(collection(db, "shifts"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Shift))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export async function saveShift(shift: Omit<Shift, "id"> & { weekLabel: string }): Promise<string> {
  const ref = await addDoc(collection(db, "shifts"), { ...shift, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateShift(id: string, data: Partial<Shift>): Promise<void> {
  await updateDoc(doc(db, "shifts", id), data);
}

export async function deleteShift(id: string): Promise<void> {
  await deleteDoc(doc(db, "shifts", id));
}

export function subscribeToShifts(
  weekLabel: string,
  cb: (shifts: Shift[]) => void
) {
  // Single where clause only — sort client-side to avoid composite index
  const q = query(
    collection(db, "shifts"),
    where("weekLabel", "==", weekLabel)
  );
  return onSnapshot(q, (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Shift))
      .sort((a, b) => a.day.localeCompare(b.day));
    cb(sorted);
  });
}

/**
 * Get all shifts for a specific employee within a date/time range.
 * Used for sick leave processing to find shifts that need to be marked vacant.
 * 
 * @param staffId - The employee's user ID
 * @param date - The date to filter shifts (format: YYYY-MM-DD or day name)
 * @param startTime - Start time of the range (format: HH:MM)
 * @param endTime - End time of the range (format: HH:MM)
 * @returns Array of shifts sorted by day and time
 */
export async function getShiftsForEmployee(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<Shift[]> {
  // Query shifts by staffId
  const q = query(
    collection(db, "shifts"),
    where("staffId", "==", staffId)
  );
  
  const snap = await getDocs(q);
  const allShifts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shift));
  
  // Filter shifts that fall within the date/time range
  const filteredShifts = allShifts.filter((shift) => {
    // Check if the shift is on the specified date
    if (shift.day !== date) {
      return false;
    }
    
    // Check if the shift overlaps with the time range
    // A shift overlaps if:
    // - shift starts before range ends AND
    // - shift ends after range starts
    const shiftStartsBeforeRangeEnds = shift.startTime < endTime;
    const shiftEndsAfterRangeStarts = shift.endTime > startTime;
    
    return shiftStartsBeforeRangeEnds && shiftEndsAfterRangeStarts;
  });
  
  // Sort by day and time
  return filteredShifts.sort((a, b) => {
    const dayCompare = a.day.localeCompare(b.day);
    if (dayCompare !== 0) return dayCompare;
    return a.startTime.localeCompare(b.startTime);
  });
}

// ── TASKS ─────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const snap = await getDocs(collection(db, "tasks"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Task))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function saveTask(task: Omit<Task, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "tasks"), { ...task, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, "tasks", id), data);
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", id));
}

export function subscribeToTasks(cb: (tasks: Task[]) => void) {
  return onSnapshot(collection(db, "tasks"), (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Task))
      .sort((a, b) => a.category.localeCompare(b.category));
    cb(sorted);
  });
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────

/**
 * Calculate inventory status based on current stock vs minimum stock.
 * - critical: ≤ 50% of minimum
 * - low: > 50% but < 100% of minimum
 * - in-stock: ≥ 100% of minimum
 */
function calculateInventoryStatus(currentStock: number, minimumStock: number): InventoryItem["status"] {
  const ratio = currentStock / minimumStock;
  if (ratio <= 0.5) return "critical";
  if (ratio < 1.0) return "low";
  return "in-stock";
}

export async function getInventory(branchId?: string): Promise<InventoryItem[]> {
  const q = branchId
    ? query(collection(db, "inventory"), where("branchId", "==", branchId))
    : query(collection(db, "inventory"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as InventoryItem))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function saveInventoryItem(item: Omit<InventoryItem, "id" | "status" | "updatedAt">): Promise<string> {
  const status = calculateInventoryStatus(item.currentStock, item.minimumStock);
  const ref = await addDoc(collection(db, "inventory"), { 
    ...item, 
    status,
    updatedAt: serverTimestamp() 
  });
  return ref.id;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
  const updates: any = { ...data, updatedAt: serverTimestamp() };
  
  // Recalculate status if stock values changed
  if (data.currentStock !== undefined || data.minimumStock !== undefined) {
    // Need to fetch current values if only one is being updated
    const docRef = doc(db, "inventory", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const current = docSnap.data() as InventoryItem;
      const newCurrentStock = data.currentStock ?? current.currentStock;
      const newMinimumStock = data.minimumStock ?? current.minimumStock;
      updates.status = calculateInventoryStatus(newCurrentStock, newMinimumStock);
    }
  }
  
  await updateDoc(doc(db, "inventory", id), updates);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "inventory", id));
}

export function subscribeToInventory(branchId: string, cb: (items: InventoryItem[]) => void) {
  const q = query(collection(db, "inventory"), where("branchId", "==", branchId));
  return onSnapshot(q, (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as InventoryItem))
      .sort((a, b) => a.category.localeCompare(b.category));
    cb(sorted);
  });
}

/**
 * Seed initial inventory data for a branch.
 * Creates 18 predefined items across 7 categories.
 * Only seeds if the branch has no inventory items yet.
 */
export async function seedInventoryData(branchId: string): Promise<void> {
  // Check if inventory already exists for this branch
  const existing = await getInventory(branchId);
  if (existing.length > 0) {
    console.log("Inventory already seeded for branch:", branchId);
    return;
  }

  const seedItems: Omit<InventoryItem, "id" | "status" | "updatedAt">[] = [
    // Meat & Seafood
    { name: "Chicken Breast", category: "Meat & Seafood", currentStock: 25, minimumStock: 30, unit: "kg", branchId },
    { name: "Salmon Fillet", category: "Meat & Seafood", currentStock: 12, minimumStock: 20, unit: "kg", branchId },
    { name: "Ground Beef", category: "Meat & Seafood", currentStock: 8, minimumStock: 25, unit: "kg", branchId },
    
    // Vegetables & Fruits
    { name: "Tomatoes", category: "Vegetables & Fruits", currentStock: 15, minimumStock: 20, unit: "kg", branchId },
    { name: "Lettuce", category: "Vegetables & Fruits", currentStock: 10, minimumStock: 15, unit: "kg", branchId },
    { name: "Onions", category: "Vegetables & Fruits", currentStock: 18, minimumStock: 25, unit: "kg", branchId },
    
    // Dairy & Eggs
    { name: "Milk", category: "Dairy & Eggs", currentStock: 40, minimumStock: 50, unit: "L", branchId },
    { name: "Eggs", category: "Dairy & Eggs", currentStock: 120, minimumStock: 200, unit: "units", branchId },
    { name: "Cheese", category: "Dairy & Eggs", currentStock: 8, minimumStock: 15, unit: "kg", branchId },
    
    // Dry Goods
    { name: "Flour", category: "Dry Goods", currentStock: 45, minimumStock: 50, unit: "kg", branchId },
    { name: "Rice", category: "Dry Goods", currentStock: 30, minimumStock: 40, unit: "kg", branchId },
    { name: "Pasta", category: "Dry Goods", currentStock: 22, minimumStock: 30, unit: "kg", branchId },
    
    // Beverages
    { name: "Orange Juice", category: "Beverages", currentStock: 25, minimumStock: 30, unit: "L", branchId },
    { name: "Coffee Beans", category: "Beverages", currentStock: 6, minimumStock: 10, unit: "kg", branchId },
    { name: "Bottled Water", category: "Beverages", currentStock: 80, minimumStock: 100, unit: "units", branchId },
    
    // Cleaning Supplies
    { name: "Dish Soap", category: "Cleaning Supplies", currentStock: 8, minimumStock: 15, unit: "L", branchId },
    { name: "Sanitizer", category: "Cleaning Supplies", currentStock: 5, minimumStock: 12, unit: "L", branchId },
    
    // Disposables
    { name: "Paper Towels", category: "Disposables", currentStock: 30, minimumStock: 50, unit: "rolls", branchId },
  ];

  // Add all seed items
  const promises = seedItems.map(item => saveInventoryItem(item));
  await Promise.all(promises);
  
  console.log(`Seeded ${seedItems.length} inventory items for branch:`, branchId);
}

// ── FORECAST ──────────────────────────────────────────────────────────────────

export async function getForecastEntries(date: string): Promise<ForecastData[]> {
  const snap = await getDocs(
    query(collection(db, "forecast"), where("date", "==", date))
  );
  return snap.docs
    .map((d) => d.data() as ForecastData)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export async function saveForecastEntry(
  date: string,
  entry: ForecastData
): Promise<void> {
  await addDoc(collection(db, "forecast"), { ...entry, date, updatedAt: serverTimestamp() });
}

// ── IN-APP NOTIFICATIONS (Firestore listener) ─────────────────────────────────

export interface AppNotification {
  id: string;
  uid: string;          // recipient uid, or "all" for broadcast
  title: string;
  body: string;
  type: "shortage" | "swap" | "taxi" | "shift" | "general";
  read: boolean;
  createdAt: any;
}

export async function sendNotification(
  uid: string,
  title: string,
  body: string,
  type: AppNotification["type"]
): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    uid, title, body, type, read: false, createdAt: serverTimestamp(),
  });
}

export function subscribeToNotifications(
  uid: string,
  cb: (notifications: AppNotification[]) => void
) {
  // Use only a single where clause to avoid requiring a composite index.
  // We filter for the user's own notifications and sort client-side.
  const q = query(
    collection(db, "notifications"),
    where("uid", "in", [uid, "all"])
  );
  return onSnapshot(q, (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AppNotification))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime; // newest first
      });
    cb(sorted);
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

/**
 * Send a notification to a worker about a shift change.
 * Generates appropriate message based on the type of change.
 * 
 * @param staffId - The worker's user ID
 * @param shift - The shift object with details
 * @param changeType - Type of change: "assigned", "modified", or "removed"
 */
export async function notifyShiftChange(
  staffId: string,
  shift: Shift,
  changeType: "assigned" | "modified" | "removed"
): Promise<void> {
  const messages = {
    assigned: `You have been assigned a ${shift.zone} shift on ${shift.day} from ${shift.startTime} to ${shift.endTime}.`,
    modified: `Your ${shift.zone} shift on ${shift.day} has been updated to ${shift.startTime} - ${shift.endTime}.`,
    removed: `Your ${shift.zone} shift on ${shift.day} has been removed.`
  };
  
  await sendNotification(staffId, "Schedule Update", messages[changeType], "shift");
}

// ── BRANCHES ──────────────────────────────────────────────────────────────────

import type { Branch } from "@/lib/types";

export async function getBranches(): Promise<Branch[]> {
  const snap = await getDocs(collection(db, "branches"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Branch))
    .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
}

export async function saveBranch(branch: Omit<Branch, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "branches"), { ...branch, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateBranch(id: string, data: Partial<Omit<Branch, "id" | "createdAt">>): Promise<void> {
  await updateDoc(doc(db, "branches", id), data);
}

export async function deleteBranch(id: string): Promise<void> {
  await deleteDoc(doc(db, "branches", id));
}

export function subscribeToBranches(cb: (branches: Branch[]) => void) {
  return onSnapshot(collection(db, "branches"), (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Branch))
      .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
    cb(sorted);
  });
}

// ── SWAP REQUESTS ─────────────────────────────────────────────────────────────

import type { SwapRequest } from "@/lib/types";

/**
 * Create a new swap request document in Firestore.
 * 
 * @param swapRequest - The swap request data (without id and createdAt)
 * @returns The ID of the created swap request
 */
export async function createSwapRequest(
  swapRequest: Omit<SwapRequest, "id" | "createdAt" | "approvedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "swapRequests"), {
    ...swapRequest,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

/**
 * Subscribe to real-time updates of swap requests.
 * Returns all swap requests sorted by creation date (newest first).
 * 
 * @param cb - Callback function that receives the updated swap requests array
 * @returns Unsubscribe function to stop listening to updates
 */
export function getSwapRequests(cb: (swapRequests: SwapRequest[]) => void) {
  return onSnapshot(collection(db, "swapRequests"), (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as SwapRequest))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime; // newest first
      });
    cb(sorted);
  });
}

/**
 * Approve a swap request and update shifts atomically using a Firestore transaction.
 * This function will be fully implemented in task 6.3.
 * 
 * @param swapId - The ID of the swap request to approve
 */
export async function approveSwapRequest(swapId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. Get swap request details
    const swapRef = doc(db, "swapRequests", swapId);
    const swapDoc = await transaction.get(swapRef);
    
    if (!swapDoc.exists()) {
      throw new Error("Swap request not found");
    }
    
    const swapData = swapDoc.data();
    const { requesterId, requesterName, requesterShiftId, targetId, targetName, targetShiftId } = swapData;
    
    // 2. Get both shift documents
    const requesterShiftRef = doc(db, "shifts", requesterShiftId);
    const targetShiftRef = doc(db, "shifts", targetShiftId);
    
    const requesterShiftDoc = await transaction.get(requesterShiftRef);
    const targetShiftDoc = await transaction.get(targetShiftRef);
    
    if (!requesterShiftDoc.exists() || !targetShiftDoc.exists()) {
      throw new Error("One or both shifts not found");
    }
    
    const requesterShift = requesterShiftDoc.data();
    const targetShift = targetShiftDoc.data();
    
    // 3. Exchange staffId and staffName between the two shifts
    transaction.update(requesterShiftRef, {
      staffId: targetId,
      staffName: targetName
    });
    
    transaction.update(targetShiftRef, {
      staffId: requesterId,
      staffName: requesterName
    });
    
    // 4. Update swap request status to APPROVED_BY_MANAGER and set approvedAt timestamp
    transaction.update(swapRef, {
      status: "APPROVED_BY_MANAGER",
      approvedAt: serverTimestamp()
    });
  });
  
  // 5. Send notifications to both workers (outside transaction)
  // Re-fetch swap data to get the details for notifications
  const swapDoc = await getDoc(doc(db, "swapRequests", swapId));
  if (swapDoc.exists()) {
    const swapData = swapDoc.data();
    const { requesterId, requesterName, targetId, targetName } = swapData;
    
    // Fetch shift details for notification messages
    const requesterShiftDoc = await getDoc(doc(db, "shifts", swapData.requesterShiftId));
    const targetShiftDoc = await getDoc(doc(db, "shifts", swapData.targetShiftId));
    
    if (requesterShiftDoc.exists() && targetShiftDoc.exists()) {
      const requesterShift = requesterShiftDoc.data();
      const targetShift = targetShiftDoc.data();
      
      // Notify requester
      await sendNotification(
        requesterId,
        "Swap Request Approved",
        `Your swap request has been approved. You will now work ${targetShift.zone} on ${targetShift.day} from ${targetShift.startTime} to ${targetShift.endTime}.`,
        "swap"
      );
      
      // Notify target
      await sendNotification(
        targetId,
        "Swap Request Approved",
        `The swap request has been approved. You will now work ${requesterShift.zone} on ${requesterShift.day} from ${requesterShift.startTime} to ${requesterShift.endTime}.`,
        "swap"
      );
    }
  }
}

/**
 * Reject a swap request by updating its status to REJECTED.
 * 
 * @param swapId - The ID of the swap request to reject
 */
export async function rejectSwapRequest(swapId: string): Promise<void> {
  await updateDoc(doc(db, "swapRequests", swapId), {
    status: "REJECTED"
  });
}
