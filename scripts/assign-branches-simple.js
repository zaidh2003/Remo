/**
 * Simple script to assign branches to existing users
 * Uses environment variables from .env.local
 * Run with: node scripts/assign-branches-simple.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// Initialize Firebase Admin with environment variables
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\n💡 Make sure your .env.local has:');
  console.log('   - FIREBASE_ADMIN_PROJECT_ID');
  console.log('   - FIREBASE_ADMIN_CLIENT_EMAIL');
  console.log('   - FIREBASE_ADMIN_PRIVATE_KEY');
  process.exit(1);
}

const db = admin.firestore();

async function assignBranches() {
  console.log('🚀 Starting branch assignment...\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📊 Found ${usersSnapshot.size} users\n`);

    // Get all branches
    const branchesSnapshot = await db.collection('branches').get();
    let branches = branchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (branches.length === 0) {
      console.log('⚠️  No branches found. Creating "Urmo Projects" branch...');
      
      const urmoRef = await db.collection('branches').add({
        name: 'Urmo Projects',
        address: 'Main Location',
        phone: '+371 2000 0000',
        manager: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      branches = [{ id: urmoRef.id, name: 'Urmo Projects' }];
      console.log('✅ Created "Urmo Projects" branch\n');
    }

    // Use first branch as default (usually "Urmo Projects")
    const defaultBranch = branches[0];
    console.log(`📍 Default branch: ${defaultBranch.name}\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Skip if user already has a branch
      if (userData.branch && userData.branch.trim() !== '') {
        console.log(`⏭️  Skipped: ${userData.name || userData.email} (already has branch: ${userData.branch})`);
        skippedCount++;
        continue;
      }

      // Assign default branch
      await db.collection('users').doc(userId).update({
        branch: defaultBranch.name,
        branchId: defaultBranch.id,
      });

      console.log(`✅ Updated: ${userData.name || userData.email} → ${defaultBranch.name}`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total users: ${usersSnapshot.size}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('='.repeat(50));
    console.log('\n✅ Branch assignment complete!');
    console.log('\n💡 Refresh your app to see the changes!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
assignBranches();
