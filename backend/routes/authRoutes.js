const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

// TEMPORARY: Emergency Admin Promotion
// Use this only if you cannot access the shell or DB directly.
router.post('/emergency-promote', async (req, res) => {
  const { email, secret } = req.body;
  if (secret !== 'emergency_admin_123') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const User = require('../models/User');
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  user.isAdmin = true;
  await user.save();
  res.json({ message: `Success: ${email} is now an Admin.` });
});

module.exports = router;
