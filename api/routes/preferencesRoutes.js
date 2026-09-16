/* eslint-disable new-cap */
const express = require('express');

const router = express.Router();

const preferencesController = require('../controllers/preferencesController');
const {verifyToken} = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const preferences = await preferencesController.getUserPreferences(req.user.uid);

    res.status(200).json({
      success: true, data: preferences});
  } catch (error) {
    next(error);
  }
});

router.put('/',
    verifyToken,
    async (req, res, next) => {
      try {
        const preferences = req.body;

        if (!preferences || Object.keys(preferences).length === 0) {
          return res.status(400).json({
            error: 'No preferences provided for update.'});
        }

        const updated = await preferencesController.updateUserPreferences(
            req.user.uid,
            preferences,
        );

        res.status(200).json({
          success: true, data: updated});
      } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('must be')) {
          return res.status(400).json({
            error: error.message});
        }
        next(error);
      }
    });

module.exports = router;

/*
Reference List
https://expressjs.com/en/guide/routing/
https://expressjs.com/en/api/#res.status
*/
