/* eslint-disable new-cap */
// api/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

// ============ PERSONAL CART ============
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const cart = await controller.getPersonalCart(req.user.uid);
    res.status(200).json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await controller.addToPersonalCart(req.user.uid, productId, quantity ?? 1);
    res.status(201).json({ success: true, data: cart });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.put('/:productId', verifyToken, async (req, res, next) => {
  try {
    const cart = await controller.updateCartQuantity(
      req.user.uid, req.params.productId, req.body.quantity,
    );
    res.status(200).json({ success: true, data: cart });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

router.delete('/:productId', verifyToken, async (req, res, next) => {
  try {
    const cart = await controller.removeFromPersonalCart(req.user.uid, req.params.productId);
    res.status(200).json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.delete('/', verifyToken, async (req, res, next) => {
  try {
    const result = await controller.clearPersonalCart(req.user.uid);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
});

module.exports = router;

/*
Reference List:
https://expressjs.com/en/guide/routing/
https://expressjs.com/en/guide/routing/#route-parameters
https://expressjs.com/en/api/#req
https://expressjs.com/en/api/#res
https://expressjs.com/en/guide/error-handling/
https://nodejs.org/api/modules.html
*/
