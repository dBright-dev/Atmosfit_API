const {getDatabase} = require('firebase-admin/database');
const {getFirestore} = require('firebase-admin/firestore');

const notificationController = require('./notificationController');

const db = getDatabase();

/**
 * Pushes a chat notification to every participant except the sender.
 *
 * Failures are logged and swallowed: a push is a courtesy, and a missing
 * device token must never fail the message write itself.
 */
async function notifyChatParticipants(chatId, senderId, text, messageId) {
  try {
    const [chatSnapshot, participantsSnapshot] = await Promise.all([
      db.ref(`chats/${chatId}`).once('value'),
      db.ref(`chats/${chatId}/participants`).once('value'),
    ]);

    const recipients = [];
    participantsSnapshot.forEach((child) => {
      if (child.key && child.key !== senderId) {
        recipients.push(child.key);
      }
    });
    if (recipients.length === 0) {
      return;
    }

    let senderName = 'Someone';
    try {
      const userDoc = await getFirestore()
          .collection('users')
          .doc(senderId)
          .get();
      if (userDoc.exists) {
        senderName = userDoc.get('displayName') || userDoc.get('name') || senderName;
      }
    } catch (error) {
      console.warn(`Chat push: sender lookup failed (${senderId}): ${error.message}`);
    }

    const isGroup = chatSnapshot.child('isGroup').val() === true;
    const groupTitle = chatSnapshot.child('title').val();
    const title = isGroup ? `${senderName} · ${groupTitle || 'Group chat'}` : senderName;
    const preview = text || 'Sent a photo';
    const body = preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;

    await Promise.all(
        recipients.map((uid) =>
          notificationController
              .sendPushToUser(uid, {
                title,
                body,
                data: {
                  type: 'chat',
                  screen: 'chat',
                  chatId,
                  senderId,
                  senderName,
                  messageId: messageId || '',
                },
              })
              .catch((error) => {
                console.warn(`Chat push to ${uid} failed: ${error.message}`);
              })
        )
    );
  } catch (error) {
    console.warn(`Chat push fan-out failed for ${chatId}: ${error.message}`);
  }
}

async function sendMessage(chatId, senderId, text, productCard = null, imageUrl = null) {
  const messageRef = db.ref(`chats/${chatId}/messages`);

  const newMessageref = messageRef.push();

  const messsage = {
    senderId,
    text: text || '',
    timestamp: Date.now(),
    productCard,
    imageUrl: imageUrl || null,
    votes: {},
  };

  await newMessageref.set(messsage);

  // Keep the thread list preview in step with the new message.
  const preview = text || (imageUrl ? '📷 Photo' : 'New message');
  db.ref(`chats/${chatId}`)
      .update({lastMessage: preview, lastMessageTime: messsage.timestamp})
      .catch((error) => console.warn(`Thread preview update failed: ${error.message}`));

  void notifyChatParticipants(chatId, senderId, preview, newMessageref.key);

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
  notifyChatParticipants,
};

/*
Reference List
Firebase Admin SDK Setup: Add the Firebase Admin SDK to your server https://firebase.google.com/docs/admin/setup
Retrieving Data: Retrieving Data | Firebase Realtime Database https://firebase.google.com/docs/database/admin/retrieve-data
Saving Data: Saving Data | Firebase Realtime Database https://firebase.google.cn/docs/database/admin/save-data
Security Rules: Understand Firebase Realtime Database Security Rules https://firebase.google.com/docs/database/security
*/
