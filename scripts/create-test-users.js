/**
 * Create Test Users for Screenshot Capture
 * 
 * This script creates test users in Firebase for screenshot automation.
 * 
 * Prerequisites:
 * 1. Firebase Admin SDK credentials
 * 2. Service account key JSON file
 * 
 * Usage: node scripts/create-test-users.js
 */

const admin = require('firebase-admin');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const TEST_USERS = [
  {
    email: 'admin@remo.app',
    password: 'Admin123!',
    displayName: 'Admin User',
    role: 'ADMIN',
    phone: '+1234567890',
    position: 'System Administrator',
    branch: 'Main Branch',
    primaryZone: 'Management'
  },
  {
    email: 'manager@remo.app',
    password: 'Manager123!',
    displayName: 'Manager User',
    role: 'MANAGER',
    phone: '+1234567891',
    position: 'Branch Manager',
    branch: 'Main Branch',
    primaryZone: 'Kitchen'
  },
  {
    email: 'employee@remo.app',
    password: 'Employee123!',
    displayName: 'Employee User',
    role: 'EMPLOYEE',
    phone: '+1234567892',
    position: 'Chef',
    branch: 'Main Branch',
    primaryZone: 'Kitchen'
  }
];

// ============================================
// INITIALIZE FIREBASE ADMIN
// ============================================

function initializeFirebase() {
  try {
    // Try to find service account key
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✓ Firebase Admin initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin');
    console.error('Make sure serviceAccountKey.json exists in project root');
    console.error('Download it from: Firebase Console > Project Settings > Service Accounts');
    return false;
  }
}

// ============================================
// CREATE USER FUNCTIONS
// ============================================

async function createAuthUser(userData) {
  try {
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      phoneNumber: userData.phone
    });
    
    console.log(`✓ Created auth user: ${userData.email}`);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠ User already exists: ${userData.email}`);
      const existingUser = await admin.auth().getUserByEmail(userData.email);
      return existingUser.uid;
    }
    throw error;
  }
}

async function createUserProfile(uid, userData) {
  try {
    const db = admin.firestore();
    
    const profileData = {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      phone: userData.phone,
      position: userData.position,
      branch: userData.branch,
      primaryZone: userData.primaryZone,
      skills: {
        [userData.primaryZone]: 'Advanced'
      },
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(uid).set(profileData);
    console.log(`✓ Created profile for: ${userData.email}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to create profile for ${userData.email}:`, error.message);
    return false;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Creating Test Users for REMO');
  console.log('=================================\n');
  
  // Initialize Firebase
  if (!initializeFirebase()) {
    process.exit(1);
  }
  
  console.log('\nCreating test users...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const userData of TEST_USERS) {
    try {
      console.log(`\nProcessing: ${userData.email} (${userData.role})`);
      
      // Create auth user
      const uid = await createAuthUser(userData);
      
      // Create Firestore profile
      await createUserProfile(uid, userData);
      
      successCount++;
      console.log(`✅ Successfully created: ${userData.email}`);
      
    } catch (error) {
      failCount++;
      console.error(`❌ Failed to create ${userData.email}:`, error.message);
    }
  }
  
  console.log('\n=================================');
  console.log('📊 Summary:');
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log('=================================\n');
  
  if (successCount > 0) {
    console.log('✅ Test users created successfully!');
    console.log('\nCredentials for screenshot script:');
    console.log('-----------------------------------');
    TEST_USERS.forEach(user => {
      console.log(`${user.role}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}\n`);
    });
    console.log('Update these in scripts/capture-screenshots.js');
  }
  
  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
