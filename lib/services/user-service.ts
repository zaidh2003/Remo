import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, query, orderBy, where, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppRole, WorkZone, WorkerSkill, ShortageAlert, ShortageResponse, SickLeaveType } from "@/lib/types";
import { getShiftsForEmployee, sendNotification } from "./data-service";

export interface UserProfile {
  uid: string;
  email: string;
  role: AppRole;
  createdAt: any;
  name?: string;
  phone?: string;
  position?: string;
  branch?: string;
  skills?: WorkerSkill[];       // zones + proficiency levels
  workerTypes?: WorkZone[];     // legacy — kept for backwards compat
}

export async function createUserProfileIfNeeded(
  uid: string,
  email: string | null,
  name?: string | null,
  initialRole: AppRole = "EMPLOYEE",
  extra?: { phone?: string; position?: string }
) {
  if (!uid) return null;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // First-run: if no users exist yet, promote to ADMIN
    const allUsers = await getDocs(collection(db, "users"));
    const assignedRole: AppRole = allUsers.empty ? "ADMIN" : initialRole;

    const newUser: UserProfile = {
      uid,
      email: email || "",
      role: assignedRole,
      name: name || email?.split("@")[0] || "Staff Member",
      phone: extra?.phone || "",
      position: extra?.position || "",
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, newUser);
    return newUser;
  }

  return userSnap.data() as UserProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;

  const profile = userSnap.data() as UserProfile;

  // Bootstrap: if this is the only user and not yet ADMIN, promote them.
  // The Firestore rule now allows self-promotion when no admin exists.
  if (profile.role !== "ADMIN") {
    try {
      const allUsers = await getDocs(collection(db, "users"));
      const adminExists = allUsers.docs.some((d) => d.data().role === "ADMIN");
      if (!adminExists) {
        await updateDoc(userRef, { role: "ADMIN" });
        return { ...profile, role: "ADMIN" };
      }
    } catch {
      // If promotion fails (e.g. multiple users, rule blocks it), continue with existing role
    }
  }

  return profile;
}

/** Fetch all user profiles — callable by ADMIN only (enforced by Firestore rules) */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "asc")));
  return snap.docs.map((d) => d.data() as UserProfile);
}

/** Update a user's role — Firestore rules allow this only if requester is ADMIN */
export async function updateUserRole(uid: string, role: AppRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

/** Update own profile fields */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, "name" | "phone" | "position" | "branch" | "skills" | "workerTypes">>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

// ── Shortage Alerts ───────────────────────────────────────────────────────────

export async function createShortageAlert(
  alert: Omit<ShortageAlert, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "shortageAlerts"), {
    ...alert,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getOpenShortageAlerts(): Promise<ShortageAlert[]> {
  const snap = await getDocs(
    query(collection(db, "shortageAlerts"), where("status", "==", "OPEN"))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ShortageAlert))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export async function getAllShortageAlerts(userProfile: UserProfile): Promise<ShortageAlert[]> {
  const snap = await getDocs(collection(db, "shortageAlerts"));
  const allAlerts = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ShortageAlert))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  
  // Admin users see all alerts
  if (userProfile.role === "ADMIN") {
    return allAlerts;
  }
  
  // Non-admin users only see alerts from their assigned branch
  return allAlerts.filter((alert) => alert.branchId === userProfile.branch);
}

export async function updateShortageAlertStatus(
  alertId: string,
  status: ShortageAlert["status"]
): Promise<void> {
  await updateDoc(doc(db, "shortageAlerts", alertId), { status });
}

export async function respondToShortageAlert(
  alertId: string,
  employeeUid: string,
  employeeName: string,
  status: "ACCEPTED" | "DENIED"
): Promise<void> {
  // Save response
  await addDoc(collection(db, "shortageResponses"), {
    alertId,
    employeeUid,
    employeeName,
    status,
    respondedAt: serverTimestamp(),
  });
  // If accepted, mark alert as FILLED
  if (status === "ACCEPTED") {
    await updateDoc(doc(db, "shortageAlerts", alertId), { status: "FILLED" });
  }
}

export async function getMyShortageResponse(
  alertId: string,
  employeeUid: string
): Promise<ShortageResponse | null> {
  const snap = await getDocs(
    query(
      collection(db, "shortageResponses"),
      where("alertId", "==", alertId),
      where("employeeUid", "==", employeeUid)
    )
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as ShortageResponse;
}

/** Get all employees with their skills — used for AI matching */
export async function getEmployeesWithZones(): Promise<UserProfile[]> {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "EMPLOYEE"))
  );
  return snap.docs.map((d) => d.data() as UserProfile);
}

/** Employee reports sick leave — auto-creates a HIGH priority shortage alert if sudden illness */
export async function reportSickLeave(
  employee: UserProfile,
  sickLeaveType: SickLeaveType,
  zone: WorkZone,
  date: string,
  startTime: string,
  endTime: string,
  note: string
): Promise<string> {
  // 1. Calculate current time automatically
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  
  // 2. Find all shifts for this employee in the sick leave period
  const shifts = await getShiftsForEmployee(employee.uid, date, startTime, endTime);
  
  // 3. Use batch write to mark all shifts as vacant
  if (shifts.length > 0) {
    const batch = writeBatch(db);
    shifts.forEach((shift) => {
      const shiftRef = doc(db, "shifts", shift.id);
      batch.update(shiftRef, {
        staffId: null,
        staffName: null,
        status: "vacant"
      });
    });
    await batch.commit();
  }
  
  // 4. Create shortage alert with calculated time window
  const priority = sickLeaveType === "SUDDEN_ILLNESS" ? "HIGH" : "NORMAL";
  const reason = sickLeaveType === "SUDDEN_ILLNESS"
    ? `🚨 Sudden illness — ${employee.name || employee.email}`
    : `Sick leave — ${note || employee.name || employee.email}`;

  const alertId = await createShortageAlert({
    createdBy: employee.uid,
    createdByName: employee.name || employee.email,
    branchId: employee.branch || "main",
    branchName: employee.branch || "Main Branch",
    zone,
    date,
    startTime: currentTime,  // Use calculated current time
    endTime,
    reason,
    priority,
    sickLeaveType,
    status: "OPEN",
  });
  
  // 5. Send notification to managers about the sick leave
  const message = `${employee.name || employee.email} reported ${sickLeaveType === "SUDDEN_ILLNESS" ? "sudden illness" : "sick leave"} for ${zone} on ${date} from ${currentTime} to ${endTime}. ${shifts.length} shift(s) marked as vacant.`;
  await sendNotification("all", "🚨 Sick Leave Reported", message, "shortage");
  
  return alertId;
}
