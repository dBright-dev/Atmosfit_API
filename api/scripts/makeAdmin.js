// api/scripts/makeAdmin.js
//
// One-time script to grant the "admin" role to a Firebase user.
// Usage:  node api/scripts/makeAdmin.js you@example.com
//
// Run this ONCE for your own account, then use the admin panel from then on.

require('dotenv').config();
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// --- Reuse the same credential loading as server.js ---
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
  serviceAccount = JSON.parse(decoded);
} else {
  serviceAccount = require('../config/serviceAccountKey.json');
}

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

async function makeAdmin(email) {
  try {
    const auth = getAuth();
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`✅ ${email} (uid: ${user.uid}) is now an admin.`);
    console.log('⚠️  They must log out and log in again for the claim to take effect.');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  process.exit(0);
}

// Read email from CLI argument
const email = process.argv[2];
if (!email) {
  console.error('Usage: node api/scripts/makeAdmin.js you@example.com');
  process.exit(1);
}
makeAdmin(email);