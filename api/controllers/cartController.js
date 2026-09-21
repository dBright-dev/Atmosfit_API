const {getDatabase} = require('firebase-admin/database');
const {getFirestore} = require('firebase-admin/firestore');

const dbRT = getDatabase();
const dbFS = getFirestore();

async function addToSharedCart(chatId, productId, userId) {
  const cartref = dbRT.ref(`chats/${chatId}/sharedCart/${productId}`);

  await cartref.set({
    addBy: userId,
    quantity: 1,
  });

  return getSharedCart(chatId);
}

async function getSharedCart(chatId) {
  const snapshot = await dbRT.ref(`chats/${chatId}/sharedCart`).once('value');
  const cartData = snapshot.val() || {};

  const items = [];
  const productIds = Object.keys(cartData);

  for (const productId of productIds) {
    const cartItem = cartData[productId];
    // Fetch product details from Firestore
    const productDoc = await dbFS.collection('products').doc(productId).get();

    if (productDoc.exists) {
      const product = productDoc.data();
      items.push({
        productId,
        name: product.name || 'Unknown Product',
        price: product.price || 0,
        imageUrl: product.imageUrl || '',
        addedBy: cartItem.addBy,
      });
    } else {
      items.push({
        productId,
        name: 'Product ' + productId,
        price: 0,
        imageUrl: '',
        addedBy: cartItem.addBy,
      });
    }
  }
  return items;
}

// Export the controller functions
module.exports = {
  addToSharedCart,
  getSharedCart,
};

/*
Reference List
Firebase Admin SDK Setup: Add the Firebase Admin SDK to your server https://firebase.google.com/docs/admin/setup
Retrieving Data: Retrieving Data | Firebase Realtime Database https://firebase.google.com/docs/database/admin/retrieve-data
Saving Data: Saving Data | Firebase Realtime Database https://firebase.google.cn/docs/database/admin/save-data
Security Rules: Understand Firebase Realtime Database Security Rules https://firebase.google.com/docs/database/security
*/
