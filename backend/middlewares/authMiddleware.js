const supabaseAdmin = require('../utils/supabaseAdmin');
const User = require('../models/User');

/**
 * protect – verifies a Supabase JWT from the Authorization header.
 * Attaches req.supabaseUser (raw Supabase user) and req.user (MongoDB profile).
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    req.supabaseUser = user;

    // Load (or lazily create) the MongoDB profile for this Supabase user
    let mongoUser = await User.findOne({ supabaseId: user.id }).select('-password');

    if (!mongoUser) {
      // First time: bootstrap the profile from Supabase data
      mongoUser = await User.create({
        supabaseId: user.id,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        // password field is no longer needed, set a placeholder so validation passes
        password: 'supabase-managed',
        isEmailVerified: !!user.email_confirmed_at,
      });
    }

    req.user = mongoUser;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err.message);
    return res.status(401).json({ message: 'Not authorized' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
