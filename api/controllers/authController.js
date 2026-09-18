// Modular Auth API
const { getAuth } = require('firebase-admin/auth');


/**
 * Registers a new user with email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's chosen password.
 * @param {string} displayName - The user's display name.
 * @return {Promise<Object>} The created user record and a custom token.
 */
async function registerUser(email, password, displayName) {
  const auth = getAuth();
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'user',
    });

    const customToken = await auth.createCustomToken(userRecord.uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      customToken,
    };
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new Error('An account with this email already exists.');
    }
    if (error.code === 'auth/invalid-password') {
      throw new Error('Password must be at least 6 characters long.');
    }
    throw error;
  }
}

async function loginUser(idToken) {
  const auth = getAuth();
  try {
    const decodedToken = await auth.verifyIdToken(idToken);

    const userRecord = await auth.getUser(decodedToken.uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      customClaims: decodedToken,
    };
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Session expired. Please sign in again');
    }
    if (error.code === 'auth/id-token-revoked') {
      throw new Error('Session revoked. Please sign in again');
    }
    throw new Error('Invalid authentication token.');
  }
}

async function getUserProfile(uid) {
  const auth = getAuth();
  try {
    const userRecord = await auth.getUser(uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    };
  } catch (error) {
    throw new Error('User not found.');
  }
}

async function logoutUser(uid) {
  const auth = getAuth();
  await auth.revokeRefreshTokens(uid);
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
};

/*
Reference List:
https://firebase.google.com/docs/auth/admin
https://firebase.google.com/docs/auth/admin/manage-users
https://firebase.google.com/docs/auth/admin/verify-id-tokens
https://firebase.google.com/docs/auth/admin/custom-claims
*/
