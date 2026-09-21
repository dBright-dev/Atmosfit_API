// api/routes/adminRoutes.js
//
// All /api/v1/admin/* endpoints. Every route requires:
//   1. A valid Firebase ID token (verifyToken)
//   2. role: "admin" claim (requireAdmin)

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// ------------------------------------------------------------------
// PRODUCTS
// ------------------------------------------------------------------

/** List all products */
router.get('/products', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const products = await adminController.listProducts();
    res.status(200).json({ success: true, data: products });
  } catch (e) { next(e); }
});

/** Create a new product */
router.post('/products', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const product = await adminController.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

/** Update a product */
router.put('/products/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const product = await adminController.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

/** Delete a product */
router.delete('/products/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await adminController.deleteProduct(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

/** Seed demo products (only if collection is empty) */
router.post('/products/seed', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await adminController.seedProducts();
    res.status(200).json({ success: true, data: result });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

module.exports = router;