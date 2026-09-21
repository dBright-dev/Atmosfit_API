// api/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const users = await userController.listUsers(req.user.uid);
    res.status(200).json({ success: true, data: users });
  } catch (e) { next(e); }
});

module.exports = router;