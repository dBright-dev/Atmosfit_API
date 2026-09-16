/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const {verifyToken} = require('../middleware/authMiddleware');

router.post(
    '/register',
    async (req, res, next) => {
      try {
        const {email, password, name} = req.body;

        if (!email || !password || !name ) {
          return res.status(400).json({
            error: 'Email, password and name is required'});
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            error: 'Please provide a valid email.'});
        }

        if (password.length < 6) {
          return res.status(400).json({
            error: 'Password must be 6 characters long.'});
        }

        const userData = await authController.registerUser(email, password, name);

        res.status(201).json({success: true, data: userData});
      } catch (error) {
        next(error);
      }
    });

router.post(
    '/login',
    async (req, res, next) => {
      try {
        const {idToken} = req.body;

        if (!idToken) {
          return res.status(400).json({error: 'ID token is required.'});
        }

        const userData = await authController.loginUser(idToken);

        res.status(200).json({success: true, data: userData});
      } catch (error) {
        next(error);
      }
    });

router.get(
    '/me',
    verifyToken,
    async (req, res, next) => {
      try {
        const userData = await authController.getUserProfile(req.user.uid);
        res.status(200).json({success: true, data: userData});
      } catch (error) {
        next(error);
      }
    });

router.get(
    '/logout',
    verifyToken,
    async (req, res, next) => {
      try {
        await authController.logoutUser(req.user.uid);
        res.status(200).json({
          success: true, message: 'Logged out successfully.'});
      } catch (error) {
        next(error);
      }
    });

module.exports = router;


/*
Reference List:
https://expressjs.com/en/guide/routing/
https://expressjs.com/en/api/#req
https://expressjs.com/en/api/#res
*/
