const User = require('../models/User');
const Scan = require('../models/Scan');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    // Get scan count for each user (inefficient but works for small app)
    // Better: use aggregation
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const scanCount = await Scan.countDocuments({ user: user._id });
      return { ...user._doc, scanCount };
    }));

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalScans = await Scan.countDocuments();
    const failedScans = await Scan.countDocuments({ status: 'failed' });
    const completedScans = await Scan.countDocuments({ status: 'completed' });

    // Calculate active visitors in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await ActivityLog.distinct('user', {
      createdAt: { $gte: oneDayAgo },
      action: { $in: ['LOGIN', 'REGISTER', 'SCAN_CREATED'] }
    });

    res.json({
      totalUsers,
      totalScans,
      failedScans,
      completedScans,
      activeUsers24h: activeUsers.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity
// @access  Private/Admin
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getSystemStats, getActivityLogs };
