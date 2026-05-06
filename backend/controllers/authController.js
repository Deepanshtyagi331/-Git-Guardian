const otplib = require('otplib');
const QRCode = require('qrcode');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// ── Profile Endpoints ─────────────────────────────────────────────────────────

// @desc    Get current user profile (MongoDB)
// @route   GET /api/auth/me
// @access  Private (Supabase JWT)
const getMe = async (req, res) => {
  // req.user is populated by the protect middleware (MongoDB document)
  const user = await User.findById(req.user._id).select('-password -mfaSecret');
  res.status(200).json(user);
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.githubUsername = req.body.githubUsername || user.githubUsername;
    user.autoScanEnabled = req.body.autoScanEnabled !== undefined ? req.body.autoScanEnabled : user.autoScanEnabled;
    user.autoScanInterval = req.body.autoScanInterval || user.autoScanInterval;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      githubUsername: updatedUser.githubUsername,
      autoScanEnabled: updatedUser.autoScanEnabled,
      autoScanInterval: updatedUser.autoScanInterval,
      isAdmin: updatedUser.isAdmin,
      mfaEnabled: updatedUser.mfaEnabled,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// ── MFA Endpoints (app-level TOTP, managed in MongoDB) ────────────────────────

// @desc    Generate MFA setup
// @route   POST /api/auth/mfa/setup
// @access  Private
const setupMfa = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.mfaEnabled) {
    return res.status(400).json({ message: 'MFA is already enabled' });
  }

  const secret = otplib.authenticator.generateSecret();
  const otpauthUrl = otplib.authenticator.keyuri(user.email, 'Git Guardian', secret);

  // Generate QR code
  QRCode.toDataURL(otpauthUrl, (err, imageUrl) => {
    if (err) {
      return res.status(500).json({ message: 'Error generating QR code' });
    }
    
    // Save secret temporarily (not fully enabled until verified)
    user.mfaSecret = secret;
    user.save();

    res.json({
      secret,
      qrCode: imageUrl,
    });
  });
};

// @desc    Enable MFA after setup
// @route   POST /api/auth/mfa/enable
// @access  Private
const enableMfa = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);

  const isValid = otplib.authenticator.check(token, user.mfaSecret);

  if (isValid) {
    user.mfaEnabled = true;
    await user.save();
    res.json({ message: 'MFA has been successfully enabled' });
  } else {
    res.status(400).json({ message: 'Invalid MFA token' });
  }
};

// @desc    Verify MFA token (for use after login if MFA is enabled)
// @route   POST /api/auth/mfa/verify
// @access  Private
const verifyMfaLogin = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);

  if (!user || !user.mfaEnabled) {
    return res.status(400).json({ message: 'User not found or MFA not enabled' });
  }

  const isValid = otplib.authenticator.check(token, user.mfaSecret);

  if (isValid) {
    await ActivityLog.create({
      user: user.id,
      action: 'LOGIN_MFA',
      ipAddress: req.ip,
    });

    res.json({ message: 'MFA verified successfully' });
  } else {
    res.status(400).json({ message: 'Invalid MFA token' });
  }
};

// @desc    Disable MFA
// @route   POST /api/auth/mfa/disable
// @access  Private
const disableMfa = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);

  const isValid = otplib.authenticator.check(token, user.mfaSecret);

  if (isValid) {
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();
    res.json({ message: 'MFA has been disabled' });
  } else {
    res.status(400).json({ message: 'Invalid MFA token' });
  }
};

module.exports = {
  getMe,
  updateUserProfile,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaLogin,
};
