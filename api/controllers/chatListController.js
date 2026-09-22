// Handles chat thread listing AND group chat creation.

const { getDatabase } = require('firebase-admin/database');
const { getFirestore } = require('firebase-admin/firestore');

const rtdb = getDatabase();
const firestore = getFirestore();

/**
 * GET /api/chats
 * Returns all chats (DMs + groups) that the user participates in.
 */
async function getMyChats(userId) {
  try {
    const chatsSnap = await rtdb.ref('chats').once('value');
    const chats = [];

    chatsSnap.forEach(child => {
      const chatId = child.key;
      const data = child.val() || {};
      const participants = data.participants || {};
      if (!participants[userId]) return;

      const messages = data.messages || {};
      const messageArray = Object.entries(messages).map(([id, m]) => ({ id, ...m }));
      messageArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      const last = messageArray[0] || null;

      const isGroup = !!data.isGroup;
      let displayName = data.title || null;
      if (!displayName && !isGroup) {
        const otherId = Object.keys(participants).find(id => id !== userId);
        displayName = otherId || 'Chat';
      }

      chats.push({
        chatId,
        displayName: displayName || 'Group',
        lastMessage: last ? last.text : '',
        lastMessageTime: last ? last.timestamp : Date.now(),
        unreadCount: 0,
        isGroup,
        participantCount: Object.keys(participants).length,
      });
    });

    // Enrich DM titles with Firestore display names.
    for (const chat of chats) {
      if (chat.isGroup) continue;
      try {
        const userDoc = await firestore.collection('users').doc(chat.displayName).get();
        if (userDoc.exists) {
          chat.displayName = userDoc.data().displayName || chat.displayName;
          chat.avatarUrl = userDoc.data().photoUrl || null;
        }
      } catch (_) { }
    }

    chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    return chats;
  } catch (e) {
    console.error('getMyChats error:', e);
    throw new Error('Failed to load chats.');
  }
}

/**
 * POST /api/chats
 * Creates (or returns) a 1:1 chat with another user.
 */
async function getOrCreateChat(userId, otherUserId) {
  const sorted = [userId, otherUserId].sort();
  const chatId = `chat_${sorted[0]}_${sorted[1]}`;

  const ref = rtdb.ref(`chats/${chatId}`);
  const snap = await ref.once('value');

  if (!snap.exists()) {
    await ref.set({
      participants: { [userId]: true, [otherUserId]: true },
      isGroup: false,
      createdAt: Date.now(),
    });
  }
  return { chatId };
}

/**
 * POST /api/chats/group
 * Creates a NEW group chat.
 * @param {string} creatorId - User creating the group.
 * @param {string} title - Group name.
 * @param {string[]} participantIds - Array of user IDs to include (excluding creator is fine).
 */
async function createGroupChat(creatorId, title, participantIds) {
  if (!title || title.trim().length === 0) {
    const e = new Error('Group name is required.');
    e.status = 400;
    throw e;
  }
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    const e = new Error('At least one participant is required.');
    e.status = 400;
    throw e;
  }

  // Build the participant map: creator + everyone else, deduplicated.
  const allIds = Array.from(new Set([creatorId, ...participantIds]));
  const participantsMap = {};
  allIds.forEach(id => { participantsMap[id] = true; });

  // Generate a unique chat ID.
  const newRef = rtdb.ref('chats').push();
  const chatId = newRef.key;

  await newRef.set({
    title: title.trim(),
    participants: participantsMap,
    isGroup: true,
    createdBy: creatorId,
    createdAt: Date.now(),
  });

  return {
    chatId,
    title: title.trim(),
    participants: allIds,
    isGroup: true,
  };
}

/**
 * GET /api/chats/:chatId
 * Returns chat metadata (for group details screen).
 */
async function getChatById(chatId, userId) {
  const snap = await rtdb.ref(`chats/${chatId}`).once('value');
  if (!snap.exists()) throw new Error('Chat not found.');
  const data = snap.val();
  if (!data.participants?.[userId]) throw new Error('Access denied.');

  return {
    chatId,
    title: data.title || null,
    isGroup: !!data.isGroup,
    participants: Object.keys(data.participants),
    createdAt: data.createdAt,
  };
}

/**
 * POST /api/chats/:chatId/participants
 * Adds a new participant to an existing group.
 */
async function addParticipant(chatId, requesterId, newUserId) {
  const ref = rtdb.ref(`chats/${chatId}`);
  const snap = await ref.once('value');
  if (!snap.exists()) throw new Error('Chat not found.');

  const data = snap.val();
  if (!data.isGroup) throw new Error('Not a group chat.');
  if (!data.participants?.[requesterId]) throw new Error('Access denied.');

  await ref.child(`participants/${newUserId}`).set(true);
  return { added: true };
}

/**
 * DELETE /api/chats/:chatId/participants/:userId
 * Removes a participant (or leaves the group).
 */
async function removeParticipant(chatId, requesterId, targetUserId) {
  const ref = rtdb.ref(`chats/${chatId}`);
  const snap = await ref.once('value');
  if (!snap.exists()) throw new Error('Chat not found.');

  const data = snap.val();
  if (!data.participants?.[requesterId]) throw new Error('Access denied.');
  // Allow self-leave even if not group admin.
  if (requesterId !== targetUserId && data.createdBy !== requesterId) {
    throw new Error('Only the creator can remove others.');
  }

  await ref.child(`participants/${targetUserId}`).remove();
  return { removed: true };
}

module.exports = {
  getMyChats,
  getOrCreateChat,
  createGroupChat,
  getChatById,
  addParticipant,
  removeParticipant,
};