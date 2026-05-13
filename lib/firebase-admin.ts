/**
 * Firebase Admin SDK initialization for server-side operations
 * Used for Firestore operations in API routes
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let db: Firestore | null = null;

/**
 * Get or initialize Firebase Admin app
 * Lazy initialization to avoid build-time errors
 */
function getAdminApp(): App {
  if (app) return app;
  
  if (!getApps().length) {
    try {
      // Check if we have service account credentials
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccount) {
        // Production: Use service account JSON
        app = initializeApp({
          credential: cert(JSON.parse(serviceAccount)),
        });
      } else {
        // Development: Use application default credentials or project ID
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        
        if (!projectId) {
          throw new Error("FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for Firebase Admin");
        }
        
        app = initializeApp({
          projectId,
        });
      }
      
      console.log("[Firebase Admin] Initialized successfully");
    } catch (error) {
      console.error("[Firebase Admin] Initialization error:", error);
      throw error;
    }
  } else {
    app = getApps()[0];
  }
  
  return app;
}

/**
 * Get Firestore instance (lazy initialization)
 */
function getAdminDb(): Firestore {
  if (db) return db;
  
  const adminApp = getAdminApp();
  db = getFirestore(adminApp);
  
  return db;
}

// Export lazy getters instead of direct instances
export { getAdminApp as app, getAdminDb as db };
