const {getFirestore} = require('firebase-admin/firestore');

const db = getFirestore();

/**
 * GET /api/v1/products
 * Returns all products. Supports optional ?category= and ?weather= filters.
 * Reference: https://firebase.google.com/docs/firestore/query-data/queries
 */
async function getAllProducts({ category, weather } = {}) {
  try {
    let query = db.collection('products').orderBy('createdAt', 'desc');
    if (weather) {
      query = query.where('weatherTag', '==', weather.toUpperCase());
    }
    if (category) {
      query = query.where('category', '==', category.toUpperCase());
    }
    const snap = await query.limit(50).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('getAllProducts error:', e);
    throw new Error('Failed to load products.');
  }
}

/**
 * GET /api/v1/products/:id
 */
async function getProductById(id) {
  const doc = await db.collection('products').doc(id).get();
  if (!doc.exists) throw new Error('Product not found.');
  return { id: doc.id, ...doc.data() };
}

async function getRecommendedProducts(weather) {
  try {
    let query = db.collection('products');

    if (weather) {
      query = query.where('weatherTags', 'array-contains', weather.toLowerCase());
    }

    const snapshot = await query.limit(20).get();

    if (snapshot.empty) {
      return [];
    }

    const products = [];
    snapshot.forEach((doc) => {
      products.push({id: doc.id, ...doc.data()});
    });

    return products;
  } catch (error) {
    console.error('Error fetching recommended products: ', error);
    throw new Error('Failed to retrieve product recommemdations.');
  }
}

module.exports = {
getAllProducts,
getProductById,
getRecommendedProducts
};
