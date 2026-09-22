// api/routes/sharedCartRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:chatId/cart', verifyToken, async (req, res, next) => {
  try {
    const cart = await controller.getSharedCart(req.params.chatId, req.user.uid);
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.post('/:chatId/cart', verifyToken, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await controller.addToSharedCart(
      req.params.chatId, req.user.uid, productId, quantity ?? 1,
    );
    res.status(201).json({ success: true, data: cart });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.delete('/:chatId/cart/:productId', verifyToken, async (req, res, next) => {
  try {
    const cart = await controller.removeFromSharedCart(
      req.params.chatId, req.user.uid, req.params.productId,
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.delete('/:chatId/cart', verifyToken, async (req, res, next) => {
  try {
    const result = await controller.clearSharedCart(req.params.chatId, req.user.uid);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
});

module.exports = router;