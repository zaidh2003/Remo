/**
 * Create Urmo Projects Template Employees
 * 
 * This script creates the 6 specialized employees from the Urmo Projects template
 * as actual Firebase Auth users with Firestore profiles.
 * 
 * Usage: node scripts/create-urmo-employees.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ============================================
// URMO PROJECTS TEMPLATE EMPLOYEES
// ============================================

const URMO_EMPLOYEES = [
  {
    email: 'andrew.trump@urmo-projects.test',
    password: 'Urmo123!',
    name: 'Andrew Trump',
    role: 'EMPLOYEE',
    phone: '+58 52551455',
    position: 'Meat Specialist',
    branch: 'Urmo Projects',
    skills: [
      { zone: 'Meat', level: 'Expert' },
      { zone: 'Grill', level: 'Expert' },
      { zone: 'Kitchen', level: 'Intermediate' }
    ]
  },
  {
    email: 'marco@urmo-projects.test',
    password: 'Urmo123!',
    name: 'Marco',
    role: 'EMPLOYEE',
    phone: '+1-555-0102',
    position: 'Preparation Chef',
    branch: 'Urmo Projects',
    skills: [
      { zone: 'Kitchen', level: 'Expert' },
      { zone: 'Salad', level: 'Expert' },
      { zone: 'Meat', level: 'Intermediate' }
    ]
  },
  {
    email: 'mia.khalifa@urmo-projects.test',
    password: 'Urmo123!',
    name: 'Mia Khalifa',
    role: 'EMPLOYEE',
    phone: '+1-555-0201',
    position: 'Dishwashing Specialist',
    branch: 'Urmo Projects',
    skills: [
      { zone: 'Dishwashing', level: 'Intermediate' },
      { zone: 'Kitchen', level: 'Intermediate' },
      { zone: 'Grill', level: 'Beginner' }
    ]
  },
  {
    email: 'brundan.jagila@urmo-projects.test',
    password: 'Urmo123!',
    name: 'Brundan Jagila',
    role: 'EMPLOYEE',
    phone: '+371 25582867',
    position: 'Burger Specialist',
    branch: 'Urmo Projects',
    skills: [
      { zone: 'Grill', level: 'Expert' },
      { zone: 'Meat', level: 'Expert' },
      { zone: 'Fries', level: 'Intermediate' }
    ]
  },
  {
    email: 'masood@urmo-projects.test',
    password: 'Urmo123!',
    name: 'Masood',
    role: 'EMPLOYEE',
    phone: '+371 2000 0005',
    position: 'Potato Specialist',
    branch: 'Urmo Projects',
    skills: [
      { zone: 'Fries', level: 'Expert' },
      { zone: 'Kitchen', level: 'Intermediate' },
      { zone: 'Salad', level: 'Beginner' }
    ]
  },
  {
    email: 'manager@urmo-projects.test',
    password: 'Urmo123!',
    name: 'Branch Manager',
    role: 'MANAGER',
    phone: '+371 2000 0001',
    position: 'Branch Manager',
    branch: 'Urmo Projects',
    skills: [
      { zone: 'Kitchen', level: 'Expert' },
      { zone: 'Grill', level: 'Expert' },
      { zone: 'Bar', level: 'Intermediate' }
    ]
  }
];

// ============================================
// INITIALIZE FIREBASE ADMIN
// ============================================

function initializeFirebase() {
  try {
    // Try service account key file first
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✓ Firebase Admin initialized with service account key');
      return true;
    }

    // Try environment variables from .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const env = {};
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      });

      const projectId = env.FIREBASE_ADMIN_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey && !privateKey.includes('your_private_key_here')) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey
          })
        });
        console.log('✓ Firebase Admin initialized with environment variables');
        return true;
      }
    }

    console.error('❌ Failed to initialize Firebase Admin');
    console.error('\nOption 1: Use service account key file');
    console.error('  1. Download serviceAccountKey.json from Firebase Console');
    console.error('  2. Place it in project root');
    console.error('  3. Run this script again');
    console.error('\nOption 2: Use environment variables');
    console.error('  1. Fill in .env.local with valid Firebase credentials');
    console.error('  2. Run this script again');
    return false;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
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
      displayName: userData.name,
      phoneNumber: userData.phone
    });
    
    console.log(`  ✓ Created auth user: ${userData.email}`);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`  ⚠ User already exists: ${userData.email}`);
      const existingUser = await admin.auth().getUserByEmail(userData.email);
      return existingUser.uid;
    }
    throw error;
  }
}

async function getBranchId(branchName) {
  const db = admin.firestore();
  const snapshot = await db.collection('branches')
    .where('name', '==', branchName)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  
  // Create branch if it doesn't exist
  console.log(`  ℹ Creating branch: ${branchName}`);
  const branchRef = await db.collection('branches').add({
    name: branchName,
    address: 'Main Location',
    phone: '+371 2000 0000',
    managerId: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return branchRef.id;
}

async function createUserProfile(uid, userData, branchId) {
  try {
    const db = admin.firestore();
    
    // Convert skills array to workerTypes for backwards compatibility
    const workerTypes = userData.skills.map(s => s.zone);
    
    const profileData = {
      uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      position: userData.position,
      branch: userData.branch,
      branchId: branchId,
      skills: userData.skills,
      workerTypes: workerTypes, // For backwards compatibility
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(uid).set(profileData);
    console.log(`  ✓ Created Firestore profile`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to create profile:`, error.message);
    return false;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Creating Urmo Projects Template Employees');
  console.log('='.repeat(50));
  console.log('');
  
  // Initialize Firebase
  if (!initializeFirebase()) {
    process.exit(1);
  }
  
  console.log('');
  console.log('Getting branch ID...');
  const branchId = await getBranchId('Urmo Projects');
  console.log(`✓ Branch ID: ${branchId}`);
  console.log('');
  
  console.log('Creating employees...');
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const userData of URMO_EMPLOYEES) {
    try {
      console.log(`${userData.name} (${userData.position})`);
      
      // Create auth user
      const uid = await createAuthUser(userData);
      
      // Create Firestore profile
      await createUserProfile(uid, userData, branchId);
      
      successCount++;
      console.log(`  ✅ Success\n`);
      
    } catch (error) {
      failCount++;
      console.error(`  ❌ Failed: ${error.message}\n`);
    }
  }
  
  console.log('='.repeat(50));
  console.log('📊 Summary:');
  console.log(`  ✓ Success: ${successCount}`);
  console.log(`  ✗ Failed: ${failCount}`);
  console.log('='.repeat(50));
  console.log('');
  
  if (successCount > 0) {
    console.log('✅ Urmo Projects employees created successfully!');
    console.log('');
    console.log('📋 Employee Credentials:');
    console.log('-'.repeat(50));
    URMO_EMPLOYEES.forEach(user => {
      console.log(`${user.name} (${user.position})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Skills: ${user.skills.map(s => `${s.zone} (${s.level})`).join(', ')}`);
      console.log('');
    });
    console.log('💡 You can now see these employees in Staff Directory!');
  }
  
  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
