import { collection, doc, query, onSnapshot, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TaxiRequest } from "@/lib/types";

export function subscribeToTaxiRequests(callback: (requests: TaxiRequest[]) => void) {
  const q = query(collection(db, "taxis"));
  
  return onSnapshot(q, (snapshot) => {
    const requests: TaxiRequest[] = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as TaxiRequest);
    });
    callback(requests);
  });
}

export async function requestTaxi(staffId: string, staffName: string, shiftId: string, type: "PICKUP" | "DROPOFF") {
  return await addDoc(collection(db, "taxis"), {
    staffId,
    staffName,
    shiftId,
    type,
    status: "PENDING",
    requestTime: new Date().toISOString(),
    createdAt: serverTimestamp()
  });
}

export async function updateTaxiStatus(id: string, status: "APPROVED" | "REJECTED") {
  const ref = doc(db, "taxis", id);
  return await updateDoc(ref, { status });
}
