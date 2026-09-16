/* eslint-disable new-cap */
const express = require('express');

const router = express.Router();

const chatController = require('../controllers/voteController');


router.post(
    '/:chatId/messages/:messageId/vote',
    async (req, res, next) => {
      try {
        const {chatId, messageId} = req.params;

        const {userId, vote} = req.body;

        if (!userId || !vote) {
          return res.status(400).json({
            error: 'userId and vote are required. '});
        }

        const updatedVotes = await chatController.voteOnMessage(chatId, messageId, userId, vote);

        res.status(200).json({
          success: true, data: updatedVotes});
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
