// api/routes/wardrobeRoutes.js
const express = require('express');
const router = express.Router();
const wardrobeController = require('../controllers/wardrobeController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/users/:userId/wardrobe', verifyToken, async (req, res, next) => {
  try {
    if (req.user.uid !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const items = await wardrobeController.getUserWardrobe(req.params.userId);
    res.status(200).json({ success: true, data: items });
  } catch (e) { next(e); }
});

router.post('/users/:userId/wardrobe', verifyToken, async (req, res, next) => {
  try {
    if (req.user.uid !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const item = await wardrobeController.addWardrobeItem(req.params.userId, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
});

router.delete('/users/:userId/wardrobe/:itemId', verifyToken, async (req, res, next) => {
  try {
    if (req.user.uid !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await wardrobeController.deleteWardrobeItem(req.params.userId, req.params.itemId);
    res.status(200).json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;