const mongoose = require('mongoose');

const scanSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    repoUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'scanning', 'completed', 'failed'],
      default: 'queued',
    },
    scanType: {
      type: String,
      enum: ['manual', 'automated'],
      default: 'manual',
    },
    results: {
      issues: [
        {
          type: { type: String }, // e.g., 'security', 'code_quality', 'secret'
          severity: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
          message: { type: String },
          file: { type: String },
          line: { type: Number },
        },
      ],
      stats: {
        critical: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
      },
    },
    error: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scan', scanSchema);
