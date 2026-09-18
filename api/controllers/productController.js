const {getFirestore} = require('firebase-admin/firestore');

const db = getFirestore();

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

module.exports = {getRecommendedProducts};
