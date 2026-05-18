/**
 * Script to assign branches to existing users
 * Run with: node scripts/assign-branches.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
    const branches = branchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (branches.length === 0) {
      console.log('⚠️  No branches found. Creating "Urmo Projects" branch...');
      
      const urmoRef = await db.collection('branches').add({
        name: 'Urmo Projects',
        address: 'Main Location',
        phone: '+371 2000 0000',
        manager: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      branches.push({ id: urmoRef.id, name: 'Urmo Projects' });
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

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
assignBranches();
