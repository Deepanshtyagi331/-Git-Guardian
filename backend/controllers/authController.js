const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

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

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // Log Activity
    await ActivityLog.create({
      user: user.id,
      action: 'REGISTER',
      ipAddress: req.ip
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user.id),
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
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
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
};
