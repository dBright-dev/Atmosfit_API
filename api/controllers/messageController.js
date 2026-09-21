const {getDatabase} = require('firebase-admin/database');

const db = getDatabase();

async function sendMessage(chatId, senderId, text, productCard = null) {
  const messageRef = db.ref(`chats/${chatId}/messages`);

  const newMessageref = messageRef.push();

  const messsage = {
    senderId,
    text,
    timestamp: Date.now(),
    productCard,
    votes: {},
  };

  await newMessageref.set(messsage);

  return {id: newMessageref.key, ...messsage};
}

async function getMessages(chatId) {
  const messageRef = db.ref(`chats/${chatId}/messages`);

  const snapshot = await messageRef
      .orderByChild('timestamp')
      .limitToLast(50)
      .once('value');

  const message = [];
  snapshot.forEach((childSnapshot) => {
    message.push({id: childSnapshot.key, ...childSnapshot.val()});
  });

  return message.reverse();
}

// Export the controller functions
module.exports = {
  sendMessage,
  getMessages,
};

/*
Reference List
Firebase Admin SDK Setup: Add the Firebase Admin SDK to your server https://firebase.google.com/docs/admin/setup
Retrieving Data: Retrieving Data | Firebase Realtime Database https://firebase.google.com/docs/database/admin/retrieve-data
Saving Data: Saving Data | Firebase Realtime Database https://firebase.google.cn/docs/database/admin/save-data
Security Rules: Understand Firebase Realtime Database Security Rules https://firebase.google.com/docs/database/security
*/
