const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const {verifyToken} = require('../middleware/authMiddleware');

/**
 * Register FCM device registration token
 * POST /api/v1/notifications/devices
 */
router.post('/devices', verifyToken, async (req, res, next) => {
  try {
    const { token, platform, userId } = req.body;
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Device token is required',
      });
    }

    const effectiveUserId = req.user.uid || userId;
    const result = await notificationController.registerDevice(
      effectiveUserId,
      token,
      platform
    );

    res.status(200).json({
      success: true,
      status: 'success',
      data: result,
      message: 'Device registered for push notifications',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Unregister FCM device token
 * DELETE /api/v1/notifications/devices/:token
 */
router.delete('/devices/:token', verifyToken, async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await notificationController.unregisterDevice(token);
    res.status(200).json({
      success: true,
      status: 'success',
      data: result,
      message: 'Device unregistered successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Send test push notification
 * POST /api/v1/notifications/test
 */
router.post('/test', async (req, res, next) => {
  try {
    const { token, title, body, data } = req.body;
    const result = await notificationController.sendTestNotification(
      token,
      title,
      body,
      data
    );

    res.status(200).json({
      success: true,
      status: 'success',
      data: result,
      message: 'Test notification sent',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
