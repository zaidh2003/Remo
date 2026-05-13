/**
 * REMO Full Demo Seed Script
 * Run: node scripts/seed-demo.mjs
 *
 * Requirements:
 *   - Place your Firebase service account JSON at: ./service-account.json
 *   - OR set GOOGLE_APPLICATION_CREDENTIALS env var to the path
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SA_PATH = path.join(__dirname, "../remo-3dedf-firebase-adminsdk-fbsvc-3ce2d742b7.json");

if (!existsSync(SA_PATH)) {
  console.error(`❌  service-account.json not found at ${SA_PATH}`);
  console.error("   Download it from Firebase Console → Project Settings → Service Accounts → Generate new private key");
  process.exit(1);
}

initializeApp({ credential: cert(SA_PATH) });
const auth = getAuth();
const db   = getFirestore();

// ── helpers ────────────────────────────────────────────────────────────────────
const now = () => Timestamp.now();
const daysFromNow = (n) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
function getWeekLabel() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().split("T")[0];
}

// ── 1. Users ───────────────────────────────────────────────────────────────────
const USERS = [
  { email: "admin@remo.demo",    password: "Demo@1234", name: "Alex Admin",      role: "ADMIN",    branch: "Branch A", position: "System Admin",  phone: "+1-555-0100", skills: [] },
  { email: "manager@remo.demo",  password: "Demo@1234", name: "Sarah Manager",   role: "MANAGER",  branch: "Branch A", position: "Head Manager",  phone: "+1-555-0101", skills: [{ zone: "Kitchen", level: "Expert" }, { zone: "Grill", level: "Expert" }] },
  { email: "chef@remo.demo",     password: "Demo@1234", name: "Marco Chef",      role: "EMPLOYEE", branch: "Branch A", position: "Head Chef",     phone: "+1-555-0102", skills: [{ zone: "Grill", level: "Expert" }, { zone: "Meat", level: "Expert" }, { zone: "Kitchen", level: "Expert" }] },
  { email: "bartender@remo.demo",password: "Demo@1234", name: "Emma Bartender",  role: "EMPLOYEE", branch: "Branch A", position: "Bartender",     phone: "+1-555-0103", skills: [{ zone: "Bar", level: "Expert" }, { zone: "Waiter", level: "Intermediate" }] },
  { email: "waiter@remo.demo",   password: "Demo@1234", name: "James Waiter",    role: "EMPLOYEE", branch: "Branch A", position: "Senior Waiter", phone: "+1-555-0104", skills: [{ zone: "Waiter", level: "Expert" }, { zone: "Host", level: "Expert" }] },
  { email: "cook@remo.demo",     password: "Demo@1234", name: "Lisa Cook",       role: "EMPLOYEE", branch: "Branch A", position: "Line Cook",     phone: "+1-555-0105", skills: [{ zone: "Kitchen", level: "Intermediate" }, { zone: "Salad", level: "Intermediate" }, { zone: "Fries", level: "Intermediate" }] },
  { email: "dishwasher@remo.demo",password:"Demo@1234", name: "Carlos Dish",     role: "EMPLOYEE", branch: "Branch A", position: "Kitchen Hand",  phone: "+1-555-0106", skills: [{ zone: "Dishwashing", level: "Expert" }, { zone: "Kitchen", level: "Beginner" }] },
  { email: "host@remo.demo",     password: "Demo@1234", name: "Sophie Host",     role: "EMPLOYEE", branch: "Branch A", position: "Host",          phone: "+1-555-0107", skills: [{ zone: "Host", level: "Intermediate" }, { zone: "Waiter", level: "Beginner" }] },
  { email: "manager2@remo.demo", password: "Demo@1234", name: "Tom Manager",     role: "MANAGER",  branch: "Branch B", position: "Branch Manager",phone: "+1-555-0200", skills: [{ zone: "Bar", level: "Expert" }] },
  { email: "staff2@remo.demo",   password: "Demo@1234", name: "Mia Staff",       role: "EMPLOYEE", branch: "Branch B", position: "Cook",          phone: "+1-555-0201", skills: [{ zone: "Kitchen", level: "Intermediate" }, { zone: "Grill", level: "Beginner" }] },
];

async function seedUsers() {
  console.log("\n👥  Seeding users...");
  const created = {};
  for (const u of USERS) {
    try {
      // Try to get existing user first
      let uid;
      try {
        const existing = await auth.getUserByEmail(u.email);
        uid = existing.uid;
        console.log(`   ↩  ${u.email} already exists`);
      } catch {
        const record = await auth.createUser({ email: u.email, password: u.password, displayName: u.name });
        uid = record.uid;
        console.log(`   ✓  Created ${u.email} (${uid})`);
      }
      await db.doc(`users/${uid}`).set({
        uid, email: u.email, name: u.name, role: u.role,
        branch: u.branch, position: u.position, phone: u.phone,
        skills: u.skills, createdAt: now(),
      }, { merge: true });
      created[u.email] = { uid, ...u };
    } catch (e) {
      console.error(`   ❌  ${u.email}: ${e.message}`);
    }
  }
  return created;
}

// ── 2. Shifts ─────────────────────────────────────────────────────────────────
async function seedShifts(users) {
  console.log("\n📅  Seeding shifts...");
  const employees = Object.values(users).filter(u => u.branch === "Branch A");
  const weekLabel = getWeekLabel();
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const slots = [
    { zone:"Kitchen",    start:"09:00", end:"17:00" },
    { zone:"Grill",      start:"12:00", end:"20:00" },
    { zone:"Bar",        start:"16:00", end:"00:00" },
    { zone:"Waiter",     start:"11:00", end:"19:00" },
    { zone:"Waiter",     start:"17:00", end:"01:00" },
    { zone:"Host",       start:"11:00", end:"19:00" },
    { zone:"Dishwashing",start:"10:00", end:"18:00" },
    { zone:"Salad",      start:"09:00", end:"15:00" },
    { zone:"Fries",      start:"11:00", end:"21:00" },
    { zone:"Meat",       start:"14:00", end:"22:00" },
  ];
  const batch = db.batch();
  let count = 0, empIdx = 0;
  const shiftIds = {}; // save two for swap request later
  for (const day of days) {
    for (const s of slots) {
      const emp = employees[empIdx % employees.length];
      const ref = db.collection("shifts").doc();
      const data = {
        staffId: emp.uid, staffName: emp.name, branchId: "Branch A",
        zone: s.zone, day, startTime: s.start, endTime: s.end,
        isEmergency: false, status: "upcoming", weekLabel, createdAt: now(),
      };
      if (!shiftIds.emp0 && emp.email === "chef@remo.demo") shiftIds.emp0 = { id: ref.id, emp, ...data };
      if (!shiftIds.emp1 && emp.email === "bartender@remo.demo") shiftIds.emp1 = { id: ref.id, emp, ...data };
      batch.set(ref, data);
      empIdx++; count++;
    }
  }
  // 2 urgent emergency shifts (vacant)
  for (const zone of ["Grill", "Bar"]) {
    const ref = db.collection("shifts").doc();
    batch.set(ref, {
      staffId: null, staffName: null, branchId: "Branch A",
      zone, day: "Saturday", startTime: "20:00", endTime: "02:00",
      isEmergency: true, status: "vacant", weekLabel, createdAt: now(),
    });
    count++;
  }
  await batch.commit();
  console.log(`   ✓  ${count} shifts`);
  return shiftIds;
}

// ── 3. Tasks ──────────────────────────────────────────────────────────────────
async function seedTasks(users) {
  console.log("\n📋  Seeding tasks...");
  const emps = Object.values(users).filter(u => u.role === "EMPLOYEE" && u.branch === "Branch A");
  const tasks = [
    ["Prep vegetables for lunch",        "Preparation",        "high",   "Kitchen",    "08:00-10:00", emps[0]],
    ["Marinate proteins",                "Preparation",        "high",   "Meat",       "09:00-10:00", emps[1]],
    ["Set up bar station",               "Preparation",        "medium", "Bar",        "10:00-11:00", emps[2]],
    ["Prepare salad base",               "Preparation",        "low",    "Salad",      "09:30-10:30", emps[3]],
    ["Cook lunch specials",              "Cooking",            "high",   "Kitchen",    "11:00-13:00", emps[0]],
    ["Grill steaks for dinner service",  "Cooking",            "high",   "Grill",      "17:00-21:00", emps[1]],
    ["Prepare fries batches",            "Cooking",            "medium", "Fries",      "11:00-22:00", emps[3]],
    ["Serve lunch customers",            "Serving",            "high",   "Waiter",     "12:00-15:00", emps[2]],
    ["Greet and seat dinner guests",     "Serving",            "high",   "Host",       "17:00-22:00", emps[4]],
    ["Mix cocktails for happy hour",     "Serving",            "medium", "Bar",        "17:00-19:00", emps[1]],
    ["Clean kitchen post-lunch",         "Cleaning",           "high",   "Kitchen",    "15:00-16:00", emps[0]],
    ["Wash dishes from lunch service",   "Cleaning",           "high",   "Dishwashing","14:00-16:00", emps[5]],
    ["Sanitise bar area at close",       "Cleaning",           "medium", "Bar",        "01:00-02:00", emps[2]],
    ["Deep clean grill station",         "Cleaning",           "low",    "Grill",      "22:00-23:00", emps[1]],
    ["Check meat stock levels",          "Inventory Management","high",  "Meat",       "08:00-09:00", emps[0]],
    ["Count beverage inventory",         "Inventory Management","medium","Bar",        "09:00-10:00", emps[2]],
    ["Order vegetables for next week",   "Inventory Management","low",  "Kitchen",    "15:00-16:00", emps[3]],
  ];
  const batch = db.batch();
  for (const [title, category, priority, zone, timeWindow, emp] of tasks) {
    batch.set(db.collection("tasks").doc(), {
      title, category, priority, zone, timeWindow,
      assignedTo: emp?.name || emp?.email || undefined,
      createdAt: now(),
    });
  }
  await batch.commit();
  console.log(`   ✓  ${tasks.length} tasks`);
}

// ── 4. Inventory ──────────────────────────────────────────────────────────────
async function seedInventory() {
  console.log("\n📦  Seeding inventory...");
  const items = [
    ["Chicken Breast",  "Meat & Seafood",       25,  30,  "kg"],
    ["Salmon Fillet",   "Meat & Seafood",       12,  20,  "kg"],
    ["Ground Beef",     "Meat & Seafood",        4,  25,  "kg"],  // critical
    ["Tomatoes",        "Vegetables & Fruits",  15,  20,  "kg"],
    ["Lettuce",         "Vegetables & Fruits",   6,  15,  "kg"],  // low
    ["Onions",          "Vegetables & Fruits",  18,  25,  "kg"],
    ["Milk",            "Dairy & Eggs",         40,  50,  "L"],
    ["Eggs",            "Dairy & Eggs",         80, 200,  "units"],  // critical
    ["Cheese",          "Dairy & Eggs",          8,  15,  "kg"],
    ["Flour",           "Dry Goods",            45,  50,  "kg"],
    ["Rice",            "Dry Goods",            30,  40,  "kg"],
    ["Pasta",           "Dry Goods",            22,  30,  "kg"],
    ["Orange Juice",    "Beverages",            25,  30,  "L"],
    ["Coffee Beans",    "Beverages",             4,  10,  "kg"],   // critical
    ["Bottled Water",   "Beverages",            80, 100,  "units"],
    ["Dish Soap",       "Cleaning Supplies",     5,  15,  "L"],    // low
    ["Sanitizer",       "Cleaning Supplies",     3,  12,  "L"],    // critical
    ["Paper Towels",    "Disposables",          30,  50,  "rolls"],
  ];
  const batch = db.batch();
  for (const [name, category, current, minimum, unit] of items) {
    const ratio = current / minimum;
    const status = ratio <= 0.5 ? "critical" : ratio < 1.0 ? "low" : "in-stock";
    batch.set(db.collection("inventory").doc(), {
      name, category, currentStock: current, minimumStock: minimum, unit,
      branchId: "Branch A", status, updatedAt: now(),
    });
  }
  await batch.commit();
  console.log(`   ✓  18 inventory items (4 critical, 3 low, 11 in-stock)`);
}

// ── 5. Forecast data ──────────────────────────────────────────────────────────
async function seedForecast() {
  console.log("\n📈  Seeding forecast data...");
  const today = new Date().toISOString().split("T")[0];
  const entries = [
    ["10:00",18,15],["11:00",42,38],["12:00",95,88],["13:00",118,112],
    ["14:00",72,68],["15:00",35,30],["16:00",28,25],["17:00",55,50],
    ["18:00",98,92],["19:00",135,128],["20:00",142,138],["21:00",110,105],["22:00",65,62],
  ];
  const batch = db.batch();
  for (const [time, predicted, historical] of entries) {
    batch.set(db.collection("forecast").doc(), { time, predicted, historical, date: today, updatedAt: now() });
  }
  await batch.commit();
  console.log(`   ✓  13 forecast data points (lunch peak 118, dinner peak 142)`);
}

// ── 6. Shortage alerts ────────────────────────────────────────────────────────
async function seedShortageAlerts(users) {
  console.log("\n🚨  Seeding shortage alerts...");
  const manager = Object.values(users).find(u => u.email === "manager@remo.demo");
  const chef    = Object.values(users).find(u => u.email === "chef@remo.demo");
  const alerts = [
    { zone:"Grill", date:daysFromNow(0), start:"18:00", end:"23:00", reason:"Staff called in sick — sudden illness", priority:"HIGH", aiUid: chef?.uid, aiReason:"Marco has Expert Grill skills and is available during this window." },
    { zone:"Bar",   date:daysFromNow(1), start:"20:00", end:"02:00", reason:"Weekend event — extra cover needed", priority:"NORMAL", aiUid:null, aiReason:null },
    { zone:"Waiter",date:daysFromNow(2), start:"12:00", end:"16:00", reason:"Approved leave — replacement needed", priority:"NORMAL", aiUid:null, aiReason:null },
  ];
  const batch = db.batch();
  const alertIds = [];
  for (const a of alerts) {
    const ref = db.collection("shortageAlerts").doc();
    alertIds.push(ref.id);
    batch.set(ref, {
      createdBy: manager.uid, createdByName: manager.name,
      branchId: "Branch A", branchName: "Branch A",
      zone: a.zone, date: a.date, startTime: a.start, endTime: a.end,
      reason: a.reason, priority: a.priority, status: "OPEN",
      ...(a.aiUid && { aiSuggestedUid: a.aiUid, aiReason: a.aiReason }),
      createdAt: now(),
    });
  }
  await batch.commit();
  console.log(`   ✓  3 alerts (1 HIGH with AI suggestion, 2 NORMAL)`);
  return alertIds;
}

// ── 7. Swap requests ──────────────────────────────────────────────────────────
async function seedSwapRequests(users, shiftIds) {
  console.log("\n🔄  Seeding swap requests...");
  const chef      = Object.values(users).find(u => u.email === "chef@remo.demo");
  const bartender = Object.values(users).find(u => u.email === "bartender@remo.demo");

  // Create two dedicated shifts for the swap
  const weekLabel = getWeekLabel();
  const shiftA = await db.collection("shifts").add({
    staffId: chef.uid, staffName: chef.name, branchId: "Branch A",
    zone: "Kitchen", day: "Saturday", startTime: "10:00", endTime: "18:00",
    isEmergency: false, status: "upcoming", weekLabel, createdAt: now(),
  });
  const shiftB = await db.collection("shifts").add({
    staffId: bartender.uid, staffName: bartender.name, branchId: "Branch A",
    zone: "Bar", day: "Saturday", startTime: "18:00", endTime: "02:00",
    isEmergency: false, status: "upcoming", weekLabel, createdAt: now(),
  });

  await db.collection("swapRequests").add({
    requesterId: chef.uid, requesterName: chef.name, requesterShiftId: shiftA.id,
    targetId: bartender.uid, targetName: bartender.name, targetShiftId: shiftB.id,
    status: "PENDING", createdAt: now(),
  });
  console.log(`   ✓  1 pending swap: ${chef.name} ↔ ${bartender.name} (Saturday)`);
}

// ── 8. Taxi requests ─────────────────────────────────────────────────────────
async function seedTaxiRequests(users) {
  console.log("\n🚖  Seeding taxi requests...");
  const chef = Object.values(users).find(u => u.email === "chef@remo.demo");
  const waiter = Object.values(users).find(u => u.email === "waiter@remo.demo");
  const batch = db.batch();
  batch.set(db.collection("taxis").doc(), {
    staffId: chef.uid, staffName: chef.name, shiftId: "demo-shift-sat",
    type: "PICKUP", status: "PENDING", requestTime: new Date().toISOString(),
    branch: "Branch A", createdAt: now(),
  });
  batch.set(db.collection("taxis").doc(), {
    staffId: waiter.uid, staffName: waiter.name, shiftId: "demo-shift-fri",
    type: "DROPOFF", status: "APPROVED", requestTime: new Date().toISOString(),
    branch: "Branch A", createdAt: now(),
  });
  await batch.commit();
  console.log(`   ✓  2 taxi requests (1 PENDING pickup, 1 APPROVED dropoff)`);
}

// ── 9. Notifications ──────────────────────────────────────────────────────────
async function seedNotifications() {
  console.log("\n🔔  Seeding notifications...");
  const notifs = [
    { title:"🚨 Staff Shortage — Grill Zone",   body:"Grill needs cover tonight 18:00–23:00. Check Shortage Alerts.", type:"shortage" },
    { title:"✅ Shift Swap Approved",            body:"Your Saturday Kitchen↔Bar swap has been approved by the manager.", type:"swap" },
    { title:"📋 New Task Assigned",              body:"'Deep clean grill station' assigned to you — due 22:00.", type:"general" },
    { title:"🚖 Transport Request Approved",     body:"Your Friday dropoff taxi has been approved.", type:"taxi" },
    { title:"📦 Inventory Alert: Low Stock",     body:"Ground Beef is critically low (4kg / 25kg min). Reorder needed.", type:"shortage" },
  ];
  const batch = db.batch();
  for (const n of notifs) {
    batch.set(db.collection("notifications").doc(), {
      uid: "all", ...n, read: false, createdAt: now(),
    });
  }
  await batch.commit();
  console.log(`   ✓  5 broadcast notifications`);
}

// ── Run all ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱  REMO Demo Data Seeder");
  console.log("═".repeat(40));

  const users = await seedUsers();
  const shiftIds = await seedShifts(users);
  await seedTasks(users);
  await seedInventory();
  await seedForecast();
  await seedShortageAlerts(users);
  await seedSwapRequests(users, shiftIds);
  await seedTaxiRequests(users);
  await seedNotifications();

  console.log("\n" + "═".repeat(40));
  console.log("✅  All demo data seeded!\n");
  console.log("Demo login credentials:");
  console.log("  ADMIN    → admin@remo.demo    / Demo@1234");
  console.log("  MANAGER  → manager@remo.demo  / Demo@1234");
  console.log("  EMPLOYEE → chef@remo.demo     / Demo@1234");
  console.log("  EMPLOYEE → bartender@remo.demo/ Demo@1234");
  console.log("  EMPLOYEE → waiter@remo.demo   / Demo@1234");
  console.log("\n🌐  App: http://localhost:3000");
  process.exit(0);
}

main().catch(e => { console.error("❌  Fatal:", e); process.exit(1); });
