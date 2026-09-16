/* eslint-disable new-cap */
const express = require('express');

const router = express.Router();

const productController = require('../controllers/productController');
const preferencesController = require('../controllers/preferencesController');
const {verifyToken} = require('../middleware/authMiddleware');

router.get(
    '/products/recommended',
    verifyToken,
    async (req, res, next) => {
      try {
        const {weather} = req.query;
        const products = await productController.getRecommendedProducts(weather);

        res.status(200).json({success: true, data: products});
      } catch (error) {
        next(error);
      }
    });

router.put(
    '/users/:userId/perefernces',
    verifyToken,
    async (req, res, next) => {
      try {
        // const preferences = await preferencesController.getUserPreferences(req.user.uid);
        const {userId} = req.params;

        if (req.user.uid !== userId ) {
          return res.status(403).json({
            error: 'You can only update your own preferences.'});
        }

        const updatedPreferences = await preferencesController.updateUserPreferences(userId, req.body);
        res.status(200).json({success: true, data: updatedPreferences});
      } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('must be')) {
          return res.status(400).json({error: error.message});
        }
        next(error);
      }
    });

router.get(
    '/users/:userId/preferences',
    verifyToken,
    async (req, res, next) => {
      try {
        const {userId} = req.params;

        if (req.user.uid !== userId) {
          return res.status(403).json({error: 'Access denied'});
        }

        const preferences = await preferencesController.getUserPreferences(userId);

        res.status(200).json({success: true, data: preferences});
      } catch (error) {
        next(error);
      }
    });

module.exports = router;
