const {getFirestore} = require('firebase-admin/firestore');

const db = getFirestore();

async function voteOnMessage(chatId, messageId, userId, vote) {
  if (vote !== 'slay' && vote != 'nay') {
    throw new Error('Vote must be either "slay" or "nay".');
  }

  const votesref = db.ref(`chats/${chatId}/messages/${messageId}/votes`);

  await votesref.update({[userId]: vote});

  const snapshot = await votesref.once('value');
  return snapshot.val();
}

// Export the controller functions
module.exports = {
  voteOnMessage,
};

/*
Reference List
Firebase Admin SDK Setup: Add the Firebase Admin SDK to your server https://firebase.google.com/docs/admin/setup
Retrieving Data: Retrieving Data | Firebase Realtime Database https://firebase.google.com/docs/database/admin/retrieve-data
Saving Data: Saving Data | Firebase Realtime Database https://firebase.google.cn/docs/database/admin/save-data
Security Rules: Understand Firebase Realtime Database Security Rules https://firebase.google.com/docs/database/security
*/
