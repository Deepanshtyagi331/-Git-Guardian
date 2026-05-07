const express = require('express');
const router = express.Router();
const {
  getMe,
  updateUserProfile,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaLogin,
  register,
  login,
  verifyEmail,
  directVerify,
} = require('../controllers/authController');


const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/direct-verify', directVerify);


// All routes below require a valid JWT
router.get('/me', protect, getMe);


router.put('/profile', protect, updateUserProfile);

// MFA (TOTP) management
router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/enable', protect, enableMfa);
router.post('/mfa/disable', protect, disableMfa);
router.post('/mfa/verify', protect, verifyMfaLogin);

module.exports = router;
