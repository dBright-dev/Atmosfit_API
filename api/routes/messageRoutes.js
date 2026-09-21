/* eslint-disable new-cap */
const express = require('express');

const router = express.Router();

const chatController = require('../controllers/messageController');
const {verifyToken} = require('../middleware/authMiddleware');

router.get(
    '/:chatId/messages',
    verifyToken,
    async (req, res, next) => {
      try {
        const {chatId} = req.params;

        const messages = await chatController.getMessages(chatId);

        res.status(200).json({success: true, data: messages});
      } catch (error) {
        next(error);
      }
    });

router.post(
    '/:chatId/messages',
    verifyToken,
    async (req, res, next) => {
      try {
        const {chatId} = req.params;

        const {senderId, text, productCard} = req.body;

        if (!senderId || !text ) {
          return res.status(400).json({
            error: 'senderId and text are required.'});
        }

        const newMessage = await chatController.sendMessage(chatId, senderId, text, productCard);

        res.status(201).json({success: true, data: newMessage});
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
