// api/controllers/chatListController.js
//
// Lists chat threads for a user based on Realtime Database membership.

const { getDatabase } = require('firebase-admin/database');
const { getFirestore } = require('firebase-admin/firestore');

const rtdb = getDatabase();
const firestore = getFirestore();

/**
 * GET /api/chats
 * Returns all chats the authenticated user participates in.
 * Enriches with display names from Firestore users collection.
 */
async function getMyChats(userId) {
  try {
    // In RTDB, we store chats/{chatId}/participants/{userId}: true
    const chatsSnap = await rtdb.ref('chats').once('value');
    const chats = [];

    chatsSnap.forEach(child => {
      const chatId = child.key;
      const data = child.val() || {};
      const participants = data.participants || {};
      if (!participants[userId]) return;

      // Get last message (if any).
      const messages = data.messages || {};
      const messageArray = Object.entries(messages).map(([id, m]) => ({ id, ...m }));
      messageArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      const last = messageArray[0] || null;

      // Determine display name: prefer group title, else other participant's name.
      let displayName = data.title || null;
      if (!displayName) {
        const otherId = Object.keys(participants).find(id => id !== userId);
        displayName = otherId || 'Chat';
      }

      chats.push({
        chatId,
        displayName,
        lastMessage: last ? last.text : '',
        lastMessageTime: last ? last.timestamp : Date.now(),
        unreadCount: 0,
        isGroup: Object.keys(participants).length > 2,
      });
    });

    // Try to enrich with real display names from Firestore.
    for (const chat of chats) {
      try {
        const userDoc = await firestore.collection('users').doc(chat.displayName).get();
        if (userDoc.exists) {
          chat.displayName = userDoc.data().displayName || chat.displayName;
          chat.avatarUrl = userDoc.data().photoUrl || null;
        }
      } catch (_) { /* ignore */ }
    }

    // Sort by most recent.
    chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    return chats;
  } catch (e) {
    console.error('getMyChats error:', e);
    throw new Error('Failed to load chats.');
  }
}

/**
 * POST /api/chats
 * Creates (or returns existing) 1:1 chat between two users.
 */
async function getOrCreateChat(userId, otherUserId) {
  // Sort IDs to make chatId deterministic.
  const sorted = [userId, otherUserId].sort();
  const chatId = `chat_${sorted[0]}_${sorted[1]}`;

  const ref = rtdb.ref(`chats/${chatId}`);
  const snap = await ref.once('value');

  if (!snap.exists()) {
    await ref.set({
      participants: { [userId]: true, [otherUserId]: true },
      createdAt: Date.now(),
    });
  }
  return { chatId };
}

module.exports = { getMyChats, getOrCreateChat };