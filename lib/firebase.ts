// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUGFDSVQVKbTGjHMyJWXyw3a32MYfQXok",
  authDomain: "remo-3dedf.firebaseapp.com",
  projectId: "remo-3dedf",
  storageBucket: "remo-3dedf.firebasestorage.app",
  messagingSenderId: "956812936514",
  appId: "1:956812936514:web:5a24b4ea3a8a5c2a6834db",
  measurementId: "G-DMNZ1VL5TM"
};

// Initialize Firebase (safely reuse if already initialized for Next.js hot reloads)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth, db, googleProvider };
