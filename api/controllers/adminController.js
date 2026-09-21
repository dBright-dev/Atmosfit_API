// api/controllers/adminController.js
//
// CRUD operations for products, accessible only to admins.

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const VALID_WEATHER_TAGS = [
  'RAINY_ESSENTIALS',
  'SUMMER_FITS',
  'WARM_LAYERS',
  'COLD_WEATHER',
  'ALL_SEASON',
];

/**
 * Validates a product payload before saving.
 * Returns an array of error strings (empty if valid).
 */
function validateProduct(body) {
  const errors = [];
  if (!body.productName || typeof body.productName !== 'string') {
    errors.push('productName is required and must be a string.');
  }
  if (body.price == null || typeof body.price !== 'number' || body.price < 0) {
    errors.push('price must be a non-negative number.');
  }
  if (!body.imageURL || typeof body.imageURL !== 'string') {
    errors.push('imageURL is required.');
  }
  if (body.weatherTag && !VALID_WEATHER_TAGS.includes(body.weatherTag)) {
    errors.push(`weatherTag must be one of: ${VALID_WEATHER_TAGS.join(', ')}`);
  }
  if (body.rating != null && (body.rating < 0 || body.rating > 5)) {
    errors.push('rating must be between 0 and 5.');
  }
  return errors;
}

/**
 * POST /api/v1/admin/products
 * Creates a new product.
 */
async function createProduct(body) {
  const errors = validateProduct(body);
  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.status = 400;
    throw err;
  }

  const docRef = db.collection('products').doc();
  const product = {
    productName: body.productName,
    price: body.price,
    rating: body.rating ?? 0,
    imageURL: body.imageURL,
    weatherTag: body.weatherTag || 'ALL_SEASON',
    stock: body.stock ?? 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await docRef.set(product);
  return { id: docRef.id, ...product };
}

/**
 * GET /api/v1/admin/products
 * Lists all products (including out-of-stock).
 */
async function listProducts() {
  const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * PUT /api/v1/admin/products/:id
 * Updates an existing product.
 */
async function updateProduct(id, body) {
  const docRef = db.collection('products').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }

  // Filter out undefined / null fields.
  const updates = {};
  const allowed = ['productName', 'price', 'rating', 'imageURL', 'weatherTag', 'stock'];
  allowed.forEach((key) => {
    if (body[key] !== undefined) updates[key] = body[key];
  });
  updates.updatedAt = Date.now();

  await docRef.update(updates);
  const updated = await docRef.get();
  return { id: updated.id, ...updated.data() };
}

/**
 * DELETE /api/v1/admin/products/:id
 * Deletes a product.
 */
async function deleteProduct(id) {
  const docRef = db.collection('products').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  await docRef.delete();
  return { deleted: true, id };
}

/**
 * POST /api/v1/admin/products/seed
 * Seeds the products collection with demo data — only if it's empty.
 */
async function seedProducts() {
  const existing = await db.collection('products').limit(1).get();
  if (!existing.empty) {
    const err = new Error('Products collection is not empty. Seed skipped.');
    err.status = 409;
    throw err;
  }

  const demo = [
    { productName: 'Denim Jeans', price: 450.0, rating: 4.5,
      imageURL: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
      weatherTag: 'WARM_LAYERS', stock: 12 },
    { productName: 'Maxi Summer Dress', price: 250.0, rating: 4.2,
      imageURL: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      weatherTag: 'SUMMER_FITS', stock: 8 },
    { productName: "Women's Trench Coat", price: 650.0, rating: 4.8,
      imageURL: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
      weatherTag: 'RAINY_ESSENTIALS', stock: 5 },
    { productName: 'Leather Jacket', price: 300.0, rating: 4.6,
      imageURL: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      weatherTag: 'WARM_LAYERS', stock: 10 },
    { productName: 'Red Rain Boots', price: 500.0, rating: 4.1,
      imageURL: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400',
      weatherTag: 'RAINY_ESSENTIALS', stock: 15 },
    { productName: "Women's Summer Co-ord", price: 300.0, rating: 4.4,
      imageURL: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400',
      weatherTag: 'SUMMER_FITS', stock: 20 },
  ];

  const batch = db.batch();
  demo.forEach((p) => {
    const ref = db.collection('products').doc();
    batch.set(ref, { ...p, createdAt: Date.now(), updatedAt: Date.now() });
  });
  await batch.commit();

  return { seeded: demo.length };
}

module.exports = {
  createProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  seedProducts,
};