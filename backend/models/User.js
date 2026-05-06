const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    // Links this MongoDB document to a Supabase Auth user
    supabaseId: { type: String, unique: true, sparse: true },

    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Password is managed by Supabase Auth – kept as a placeholder for legacy data
    password: { type: String, default: 'supabase-managed' },

    githubToken: { type: String },
    githubUsername: { type: String },
    isAdmin: { type: Boolean, required: true, default: false },
    autoScanEnabled: { type: Boolean, default: false },
    autoScanInterval: { type: Number, default: 7 }, // default 7 days
    lastAutoScan: { type: Date },

    // Kept for any legacy users; Supabase handles email verification going forward
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },

    // MFA is now handled by Supabase (TOTP built-in), kept for backward compatibility
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
