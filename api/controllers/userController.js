// api/controllers/userController.js
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const firestore = getFirestore();

/**
 * GET /api/users
 * Lists all users except the caller. Useful for "start a new chat".
 */
async function listUsers(excludeUid) {
  try {
    const listResult = await getAuth().listUsers(100);
    const users = [];

    for (const user of listResult.users) {
      if (user.uid === excludeUid) continue;
      const doc = await firestore.collection('users').doc(user.uid).get();
      const extra = doc.exists ? doc.data() : {};
      users.push({
        uid: user.uid,
        displayName: user.displayName || extra.displayName || user.email || 'User',
        email: user.email,
        photoUrl: user.photoURL || extra.photoUrl || null,
      });
    }
    return users;
  } catch (e) {
    console.error('listUsers error:', e);
    throw new Error('Failed to load users.');
  }
}

module.exports = { listUsers };