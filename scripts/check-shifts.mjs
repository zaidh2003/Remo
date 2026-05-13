import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const sa = JSON.parse(readFileSync("remo-3dedf-firebase-adminsdk-fbsvc-3ce2d742b7.json", "utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const snap = await db.collection("shifts").limit(5).get();
console.log("Total shift docs in Firestore:", snap.size);
snap.docs.forEach(d => {
  const data = d.data();
  console.log(`  weekLabel: "${data.weekLabel}" | day: "${data.day}" | zone: "${data.zone}" | staff: "${data.staffName}"`);
});
process.exit(0);
