const otplib = require('otplib');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/sendEmail');

// Helper to create JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key', {
    expiresIn: '30d',
  });
};

// ── Registration & Auth ──────────────────────────────────────────────────────

// @desc    Register a new user (Custom)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Operator identity already exists in database' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
    });

    if (user) {
      await ActivityLog.create({
        user: user._id,
        action: 'REGISTER',
        ipAddress: req.ip,
      });

      // Send verification email via Nodemailer
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${email}`;

      console.log('-----------------------------------------');
      console.log('[Register Debug] Verification Link Generated:');
      console.log(verificationUrl);
      console.log('-----------------------------------------');

      // Send verification email in the background (DO NOT AWAIT)
      // This prevents the entire request from timing out if the email service is slow.
      sendEmail({
        to: email,
        subject: '🔐 Initialize Protocol: Verify Your Identity',
        html: `
          <div style="background-color: #020617; color: #f8fafc; font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase;">Git Guardian</h1>
            </div>
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px;">Hello <span style="color: #818cf8; font-weight: 700;">${name}</span>,</p>
              <p style="line-height: 1.6; color: #94a3b8;">Welcome to the Git Guardian protocol. To activate your operator console, please establish your identity by clicking the button below.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" style="background: linear-gradient(to right, #4f46e5, #0891b2); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Verify Identity</a>
              </div>
              <p style="font-size: 11px; color: #475569; background: #0f172a; padding: 15px; border-radius: 8px;">${verificationUrl}</p>
            </div>
          </div>
        `
      }).catch(err => console.error('[Background Email Error]:', err.message));

      res.status(201).json({
        message: 'Registration successful. Verification protocol initiated.',
      });

    }
  } catch (error) {
    console.error('[Register Error]:', error);
    // Return specific error message for debugging production failures
    res.status(500).json({
      message: error.message || 'Identity establishment failed during registration protocol'
    });
  }

};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isEmailVerified) {
        return res.status(401).json({ message: 'Email not verified. Please check your inbox.' });
      }

      await ActivityLog.create({
        user: user._id,
        action: 'LOGIN',
        ipAddress: req.ip,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ message: `Internal Server Error during login: ${error.message}` });
  }

};

// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  const { token, email } = req.query;
  console.log(`[Verify Debug] Attempting verification for: ${email}`);
  console.log(`[Verify Debug] Token received: ${token}`);

  try {
    const user = await User.findOne({ email, emailVerificationToken: token });

    if (!user) {
      console.log('[Verify Debug] FAILED: No matching user found with this token.');
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    console.log('[Verify Debug] SUCCESS: User found. Updating status...');
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('[Verify Error]:', error);
    res.status(500).json({ message: 'Error during email verification' });
  }
};


// ── Profile Endpoints ─────────────────────────────────────────────────────────

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
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

// ── MFA Endpoints (TOTP) ──────────────────────────────────────────────────────

const setupMfa = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.mfaEnabled) return res.status(400).json({ message: 'MFA already active' });

  const secret = otplib.authenticator.generateSecret();
  const otpauthUrl = otplib.authenticator.keyuri(user.email, 'Git Guardian', secret);

  QRCode.toDataURL(otpauthUrl, (err, imageUrl) => {
    if (err) return res.status(500).json({ message: 'QR Code Failure' });
    user.mfaSecret = secret;
    user.save();
    res.json({ secret, qrCode: imageUrl });
  });
};

const enableMfa = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);
  const isValid = otplib.authenticator.check(token, user.mfaSecret);

  if (isValid) {
    user.mfaEnabled = true;
    await user.save();
    res.json({ message: 'MFA Enabled' });
  } else {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

const verifyMfaLogin = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);
  if (!user || !user.mfaEnabled) return res.status(400).json({ message: 'MFA not active' });

  if (otplib.authenticator.check(token, user.mfaSecret)) {
    res.json({ message: 'MFA Verified' });
  } else {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

const disableMfa = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);
  if (otplib.authenticator.check(token, user.mfaSecret)) {
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();
    res.json({ message: 'MFA Disabled' });
  } else {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  getMe,
  updateUserProfile,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaLogin,
};


