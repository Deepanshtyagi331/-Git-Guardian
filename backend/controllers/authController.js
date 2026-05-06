const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const otplib = require('otplib');
const QRCode = require('qrcode');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const emailVerificationToken = crypto.randomBytes(20).toString('hex');

  const user = await User.create({
    name,
    email,
    password,
    emailVerificationToken,
  });

  if (user) {
    // Log Activity
    await ActivityLog.create({
      user: user.id,
      action: 'REGISTER',
      ipAddress: req.ip
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
      console.warn('[Warning] FRONTEND_URL is not set in production. Verification links will default to localhost.');
    }
    const verifyUrl = `${frontendUrl}/verify-email/${emailVerificationToken}`;

    const message = `
      <h2>Welcome to Git Guardian</h2>
      <p>Please confirm your email address by clicking the link below:</p>
      <a href="${verifyUrl}" target="_blank">Verify Email</a>
      <p>Or copy and paste this link: <br> ${verifyUrl}</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your Git Guardian Account',
        html: message,
      });
      console.log(`[Registration] Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`[Registration Error] Failed to send verification email to ${user.email}`);
      console.error(`[Reason] ${emailError.message}`);
      // We continue here so the user is still created, but they might need a resend option later
    }
    
    // Explicitly logging it to the console as per requirements to test without email easily
    console.log('\n' + '='.repeat(60));
    console.log('       DEVELOPMENT VERIFICATION LINK (COPY & PASTE)');
    console.log('='.repeat(60));
    console.log(verifyUrl);
    console.log('='.repeat(60) + '\n');

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    if (user.mfaEnabled) {
      // Give a temporary token for MFA step
      const tempToken = jwt.sign({ id: user.id, mfaPending: true }, process.env.JWT_SECRET, { expiresIn: '10m' });
      return res.json({
        mfaRequired: true,
        tempToken,
        message: 'MFA code required',
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: user.id,
      action: 'LOGIN',
      ipAddress: req.ip
    });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      mfaEnabled: user.mfaEnabled,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({ message: 'Email successfully verified. You can now log in.' });
};

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

// @desc    Verify MFA token during login
// @route   POST /api/auth/mfa/verify
// @access  Public (needs tempToken)
const verifyMfaLogin = async (req, res) => {
  const { token, tempToken } = req.body;

  if (!tempToken || !token) {
    return res.status(400).json({ message: 'Missing tokens' });
  }

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.mfaPending) {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ message: 'User not found or MFA not enabled' });
    }

    const isValid = otplib.authenticator.check(token, user.mfaSecret);

    if (isValid) {
      // Log Activity
      await ActivityLog.create({
        user: user.id,
        action: 'LOGIN_MFA',
        ipAddress: req.ip
      });

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        mfaEnabled: user.mfaEnabled,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid MFA token' });
    }
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired temporary token' });
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


// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -mfaSecret');
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
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  verifyEmail,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaLogin,
};
