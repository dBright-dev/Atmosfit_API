// Personal Cart: Firestore users/{uid}/cart/{productId}
// Shared Cart:   Realtime DB chats/{chatId}/sharedCart/{productId}


const { getFirestore } = require('firebase-admin/firestore');
const { getDatabase } = require('firebase-admin/database');

const firestore = getFirestore();
const rtdb = getDatabase();

// ==================== PERSONAL CART ====================

/**
 * GET /api/v1/cart
 * Returns all items in the user's personal cart, with subtotals and total.
 */
async function getPersonalCart(userId) {
  const snap = await firestore.collection('users').doc(userId).collection('cart').get();
  const items = [];

  for (const doc of snap.docs) {
    const item = doc.data();
    // Fetch product details for up-to-date price.
    const productDoc = await firestore.collection('products').doc(item.productId).get();
    const product = productDoc.exists ? productDoc.data() : {};

    items.push({
      productId: item.productId,
      productName: product.productName || item.productName || 'Product',
      price: product.price ?? item.price ?? 0,
      imageURL: product.imageURL || item.imageURL || '',
      quantity: item.quantity || 1,
      subtotal: (product.price ?? item.price ?? 0) * (item.quantity || 1),
      addedAt: item.addedAt || 0,
    });
  }

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  return { items, total, count: items.length };
}

/**
 * POST /api/v1/cart
 * Body: { productId, quantity? }
 * Adds (or increments) a product in the personal cart.
 */
async function addToPersonalCart(userId, productId, quantity = 1) {
  if (!productId) {
    const e = new Error('productId is required.');
    e.status = 400;
    throw e;
  }

  const productDoc = await firestore.collection('products').doc(productId).get();
  if (!productDoc.exists) {
    const e = new Error('Product not found.');
    e.status = 404;
    throw e;
  }
  const product = productDoc.data();

  const itemRef = firestore.collection('users').doc(userId).collection('cart').doc(productId);
  const existing = await itemRef.get();

  if (existing.exists) {
    const currentQty = existing.data().quantity || 1;
    await itemRef.update({ quantity: currentQty + quantity });
  } else {
    await itemRef.set({
      productId,
      productName: product.productName,
      price: product.price,
      imageURL: product.imageURL,
      quantity,
      addedAt: Date.now(),
    });
  }

  return getPersonalCart(userId);
}

/**
 * PUT /api/v1/cart/:productId
 * Body: { quantity }
 * Sets the exact quantity (0 removes the item).
 */
async function updateCartQuantity(userId, productId, quantity) {
  const qty = parseInt(quantity);
  if (isNaN(qty) || qty < 0) {
    const e = new Error('quantity must be >= 0.');
    e.status = 400;
    throw e;
  }
  const itemRef = firestore.collection('users').doc(userId).collection('cart').doc(productId);
  if (qty === 0) {
    await itemRef.delete();
  } else {
    await itemRef.set({ quantity: qty }, { merge: true });
  }
  return getPersonalCart(userId);
}

/**
 * DELETE /api/v1/cart/:productId
 */
async function removeFromPersonalCart(userId, productId) {
  await firestore.collection('users').doc(userId).collection('cart').doc(productId).delete();
  return getPersonalCart(userId);
}

/**
 * DELETE /api/v1/cart
 * Empties the cart.
 */
async function clearPersonalCart(userId) {
  const snap = await firestore.collection('users').doc(userId).collection('cart').get();
  const batch = firestore.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return { cleared: true };
}

// ==================== SHARED CART (Group Chat) ====================

/**
 * GET /api/chats/:chatId/cart
 * Returns the shared cart with computed subtotals.
 */
async function getSharedCart(chatId, userId) {
  // Verify membership.
  const chatSnap = await rtdb.ref(`chats/${chatId}/participants/${userId}`).once('value');
  if (!chatSnap.exists()) {
    const e = new Error('Access denied.');
    e.status = 403;
    throw e;
  }

  const cartSnap = await rtdb.ref(`chats/${chatId}/sharedCart`).once('value');
  const cartData = cartSnap.val() || {};
  const items = [];

  for (const [productId, item] of Object.entries(cartData)) {
    const productDoc = await firestore.collection('products').doc(productId).get();
    const product = productDoc.exists ? productDoc.data() : {};
    const price = product.price ?? item.price ?? 0;
    const qty = item.quantity || 1;

    items.push({
      productId,
      productName: product.productName || item.productName || 'Product',
      price,
      imageURL: product.imageURL || item.imageURL || '',
      quantity: qty,
      subtotal: price * qty,
      addedBy: item.addedBy || '',
      addedByName: item.addedByName || '',
      addedAt: item.addedAt || 0,
    });
  }

  items.sort((a, b) => a.addedAt - b.addedAt);
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  return { items, total, count: items.length };
}

/**
 * POST /api/chats/:chatId/cart
 * Body: { productId, quantity? }
 */
async function addToSharedCart(chatId, userId, productId, quantity = 1) {
  if (!productId) {
    const e = new Error('productId is required.');
    e.status = 400;
    throw e;
  }

  const chatSnap = await rtdb.ref(`chats/${chatId}/participants/${userId}`).once('value');
  if (!chatSnap.exists()) {
    const e = new Error('Access denied.');
    e.status = 403;
    throw e;
  }

  const productDoc = await firestore.collection('products').doc(productId).get();
  if (!productDoc.exists) {
    const e = new Error('Product not found.');
    e.status = 404;
    throw e;
  }
  const product = productDoc.data();

  const itemRef = rtdb.ref(`chats/${chatId}/sharedCart/${productId}`);
  const existing = await itemRef.once('value');

  if (existing.exists()) {
    const qty = (existing.val().quantity || 1) + quantity;
    await itemRef.update({ quantity: qty });
  } else {
    await itemRef.set({
      productId,
      productName: product.productName,
      price: product.price,
      imageURL: product.imageURL,
      quantity,
      addedBy: userId,
      addedByName: '',
      addedAt: Date.now(),
    });
  }

  return getSharedCart(chatId, userId);
}

/**
 * DELETE /api/chats/:chatId/cart/:productId
 */
async function removeFromSharedCart(chatId, userId, productId) {
  const chatSnap = await rtdb.ref(`chats/${chatId}/participants/${userId}`).once('value');
  if (!chatSnap.exists()) {
    const e = new Error('Access denied.');
    e.status = 403;
    throw e;
  }
  await rtdb.ref(`chats/${chatId}/sharedCart/${productId}`).remove();
  return getSharedCart(chatId, userId);
}

/**
 * DELETE /api/chats/:chatId/cart
 */
async function clearSharedCart(chatId, userId) {
  const chatSnap = await rtdb.ref(`chats/${chatId}/participants/${userId}`).once('value');
  if (!chatSnap.exists()) {
    const e = new Error('Access denied.');
    e.status = 403;
    throw e;
  }
  await rtdb.ref(`chats/${chatId}/sharedCart`).remove();
  return { cleared: true };
}

module.exports = {
  // Personal
  getPersonalCart,
  addToPersonalCart,
  updateCartQuantity,
  removeFromPersonalCart,
  clearPersonalCart,
  // Shared
  getSharedCart,
  addToSharedCart,
  removeFromSharedCart,
  clearSharedCart,
};

/*
Reference List
Firebase Admin SDK Setup: Add the Firebase Admin SDK to your server https://firebase.google.com/docs/admin/setup
Retrieving Data: Retrieving Data | Firebase Realtime Database https://firebase.google.com/docs/database/admin/retrieve-data
Saving Data: Saving Data | Firebase Realtime Database https://firebase.google.cn/docs/database/admin/save-data
Security Rules: Understand Firebase Realtime Database Security Rules https://firebase.google.com/docs/database/security
*/
