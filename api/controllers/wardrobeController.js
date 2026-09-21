// api/controllers/wardrobeController.js

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

/**
 * Retrieves all wardrobe items for a user.
 * Endpoint: GET /api/v1/users/:userId/wardrobe
 */
async function getUserWardrobe(userId) {
  try {
    const snapshot = await db.collection('users').doc(userId)
      .collection('wardrobe').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching wardrobe:', error);
    throw new Error('Failed to load wardrobe.');
  }
}

/**
 * Adds a new wardrobe item to the user's collection.
 * Endpoint: POST /api/v1/users/:userId/wardrobe
 */
async function addWardrobeItem(userId, itemData) {
  const { itemID, imageURL, category, colour, thermalUtility } = itemData;
  if (!imageURL || !category) {
    throw new Error('imageURL and category are required.');
  }
  const docRef = db.collection('users').doc(userId)
    .collection('wardrobe').doc(itemID || undefined);
  await docRef.set({
    itemID: docRef.id,
    userID: userId,
    imageURL,
    category,
    colour: colour || '',
    thermalUtility: thermalUtility || 'ALL_SEASON',
    createdAt: Date.now(),
  }, { merge: true });
  return { id: docRef.id };
}

/**
 * Deletes a wardrobe item.
 * Endpoint: DELETE /api/v1/users/:userId/wardrobe/:itemId
 */
async function deleteWardrobeItem(userId, itemId) {
  await db.collection('users').doc(userId)
    .collection('wardrobe').doc(itemId).delete();
  return { deleted: true };
}

module.exports = { getUserWardrobe, addWardrobeItem, deleteWardrobeItem };