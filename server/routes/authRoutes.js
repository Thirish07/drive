const express = require('express');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');
const protect = require('../middleware/protect'); 

const router = express.Router();

router.post('/register', [
  check('username').notEmpty(),
  check('email').isEmail(),
  check('phone_no').notEmpty(),
  check('firstname').notEmpty(),
  check('lastname').notEmpty(),
  check('password').isLength({ min: 6 }),
], validate, authController.register);

router.post('/verify-otp', [
  check('email').isEmail(),
  check('otp').isNumeric().isLength({ min: 6, max: 6 }),
], validate, authController.verifyOTP);

router.post('/resend-otp', [
  check('email').isEmail(),
], validate, authController.resendOTP);

router.post('/login', [
  check('email').isEmail(),
  check('password').isLength({ min: 6 }),
], validate, authController.login);

router.put('/edit', protect, authController.editUser);
router.post('/logout', protect, authController.logout);
router.delete('/delete', protect, authController.deleteAccount);
router.get('/me',protect,authController.dashboard);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);


module.exports = router;
