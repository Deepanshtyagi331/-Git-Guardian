const express = require('express');
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'Guardian Protocol Online', timestamp: new Date() });
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
