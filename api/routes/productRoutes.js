// api/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { category, weather } = req.query;
    const products = await productController.getAllProducts({ category, weather });
    res.status(200).json({ success: true, data: products });
  } catch (e) { next(e); }
});

router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const product = await productController.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (e) { next(e); }
});

module.exports = router;