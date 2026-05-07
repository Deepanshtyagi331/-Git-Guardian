const express = require('express');
const User = require('./models/User');

const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./utils/db');
const { scheduleAutoScans } = require('./jobs/autoScan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  connectDB().then(() => {
    scheduleAutoScans();
  });
} else {
  // Always connect in serverless but skip intervals
  connectDB();
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scans', require('./routes/scanRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root test route
app.get('/', (req, res) => {
  res.send('Backend is running smoothly on Render!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Guardian Protocol Online', timestamp: new Date() });
});

// --- ZERO-FAILURE DIRECT VERIFY (Root Level) ---
app.get('/direct-verify', async (req, res) => {
  const { token, email } = req.query;
  const frontendUrl = (process.env.FRONTEND_URL || 'https://git-guardian.vercel.app').replace(/\/+$/, '');
  const loginUrl = `${frontendUrl}/login`;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send('<h1>Verification Failed</h1><p>User identity not found.</p>');
    
    if (user.isEmailVerified) return res.redirect(`${loginUrl}?message=Already verified`);
    
    if (user.emailVerificationToken !== token) {
       console.log(`[Direct Verify Error] Token Mismatch. DB: ${user.emailVerificationToken} URL: ${token}`);
       return res.status(400).send('<h1>Verification Failed</h1><p>Invalid token identity.</p>');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    
    console.log(`[Direct Verify Success] Verified: ${email}`);
    res.redirect(`${loginUrl}?verified=true`);
  } catch (error) {
    console.error('[Direct Verify Error]:', error);
    res.status(500).send('<h1>Internal Error</h1><p>Protocol failure during activation.</p>');
  }
});


// Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;
