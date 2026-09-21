// api/routes/chatListRoutes.js
const express = require('express');
const router = express.Router();
const chatListController = require('../controllers/chatListController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/chats
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const chats = await chatListController.getMyChats(req.user.uid);
    res.status(200).json({ success: true, data: chats });
  } catch (e) { next(e); }
});

// POST /api/chats  (body: { otherUserId })
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId is required.' });
    const result = await chatListController.getOrCreateChat(req.user.uid, otherUserId);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
});

module.exports = router;