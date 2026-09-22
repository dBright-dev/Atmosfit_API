// api/routes/chatListRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatListController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/chats — list my chats
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const chats = await controller.getMyChats(req.user.uid);
    res.status(200).json({ success: true, data: chats });
  } catch (e) { next(e); }
});

// POST /api/chats — create or get 1:1 chat
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required.' });
    const result = await controller.getOrCreateChat(req.user.uid, otherUserId);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
});

// POST /api/chats/group — create group chat
router.post('/group', verifyToken, async (req, res, next) => {
  try {
    const { title, participantIds } = req.body;
    const result = await controller.createGroupChat(req.user.uid, title, participantIds);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

// GET /api/chats/:chatId — get chat info
router.get('/:chatId', verifyToken, async (req, res, next) => {
  try {
    const info = await controller.getChatById(req.params.chatId, req.user.uid);
    res.status(200).json({ success: true, data: info });
  } catch (e) { next(e); }
});

// POST /api/chats/:chatId/participants — add member
router.post('/:chatId/participants', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required.' });
    const result = await controller.addParticipant(req.params.chatId, req.user.uid, userId);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
});

// DELETE /api/chats/:chatId/participants/:userId — remove/leave
router.delete('/:chatId/participants/:userId', verifyToken, async (req, res, next) => {
  try {
    const result = await controller.removeParticipant(
      req.params.chatId, req.user.uid, req.params.userId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
});

module.exports = router;