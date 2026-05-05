/**
 * Firestore services for: Shifts, Tasks, Inventory, Forecast entries
 */
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, serverTimestamp,
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

export async function getInventory(): Promise<InventoryItem[]> {
  const snap = await getDocs(collection(db, "inventory"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as InventoryItem))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function saveInventoryItem(item: Omit<InventoryItem, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "inventory"), { ...item, updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
  const updates: any = { ...data, updatedAt: serverTimestamp() };
  if (data.quantity !== undefined && data.minStock !== undefined) {
    const ratio = data.quantity / data.minStock;
    updates.status = ratio <= 0.3 ? "critical" : ratio <= 0.7 ? "low" : "in-stock";
  }
  await updateDoc(doc(db, "inventory", id), updates);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "inventory", id));
}

export function subscribeToInventory(cb: (items: InventoryItem[]) => void) {
  return onSnapshot(collection(db, "inventory"), (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as InventoryItem))
      .sort((a, b) => a.category.localeCompare(b.category));
    cb(sorted);
  });
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
