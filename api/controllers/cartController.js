const {getFirestore} = require('firebase-admin/firestore');

const db = getFirestore();


async function addToSharedCart(chatId, productId, userId) {
  const cartref = db.ref(`chats/${chatId}/sharedCart/${productId}`);

  await cartref.set({
    addBy: userId,
    quantity: 1,
  });

  const snapshot = await db.ref(`chats/${chatId}/sharedCart`).once('value');
  return snapshot.val();
}

// Export the controller functions
module.exports = {
  addToSharedCart,
};

/*
Reference List
Firebase Admin SDK Setup: Add the Firebase Admin SDK to your server https://firebase.google.com/docs/admin/setup
Retrieving Data: Retrieving Data | Firebase Realtime Database https://firebase.google.com/docs/database/admin/retrieve-data
Saving Data: Saving Data | Firebase Realtime Database https://firebase.google.cn/docs/database/admin/save-data
Security Rules: Understand Firebase Realtime Database Security Rules https://firebase.google.com/docs/database/security
*/
