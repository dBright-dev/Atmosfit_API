/* eslint-disable new-cap */
const express = require('express');

const router = express.Router();

const chatController = require('../controllers/cartController');
const {verifyToken} = require('../middleware/authMiddleware');


router.get(
    '/:chatId/cart',
    verifyToken,
    async (req, res, next) => {
      try {
        const {chatId} = req.params;
        const cart = await chatController.getSharedCart(chatId);
        res.status(200).json({success: true, data: cart});
      } catch (error) {
        next(error);
      }
    });

router.post(
    '/:chatId/cart',
    verifyToken,
    async (req, res, next) =>{
      try {
        const {chatId} = req.params;

        const {productId, userId} = req.body;

        if (!productId || !userId) {
          return res.status(400).json({
            error: 'productId and userId are required.'});
        }

        const updateCart = await chatController
            .addToSharedCart(chatId, productId, userId);

        res.status(200).json({success: true, data: updateCart});
      } catch (error) {
        next(error);
      }
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
