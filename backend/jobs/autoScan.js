const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const User = require('../models/User');
const Scan = require('../models/Scan');
const { processScan } = require('../services/scanService');
const { Octokit } = require('octokit');

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    // Only retry every 30 seconds after the first few attempts to stop console flooding
    const delay = Math.min(times * 50, 30000);
    return delay;
  },
});

let redisAvailable = true;
redisConnection.on('error', (error) => {
  if (redisAvailable) {
    console.warn('⚠️  Auto-Scan Protocol: Redis is offline. Automated scans will be queued once service is restored.');
    redisAvailable = false;
  }
});

redisConnection.on('connect', () => {
  console.log('✅ Auto-Scan Protocol: Redis connection established.');
  redisAvailable = true;
});

const scanQueue = new Queue('scan-queue', { connection: redisConnection });

scanQueue.on('error', (error) => {
  if (redisAvailable) {
    console.warn('Scan Queue Error:', error.message);
  }
});

// Worker for actual scanning
const scanWorker = new Worker('scan-queue', async (job) => {
  const { userId } = job.data;
  const user = await User.findById(userId);
  if (!user || !user.githubUsername) return;

  console.log(`[AutoScan] Starting scheduled scan for user: ${user.githubUsername}`);

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN || process.env.GITHUB_CLIENT_SECRET,
  });

  try {
    const response = await octokit.request('GET /users/{username}/repos', {
      username: user.githubUsername,
      sort: 'updated',
      per_page: 5, // Limiting to top 5 for auto-scan
    });

    const repos = response.data;
    for (const repo of repos) {
      console.log(`[AutoScan] Queuing scan for repo: ${repo.full_name}`);
      const scan = await Scan.create({
        user: user._id,
        repoUrl: repo.clone_url,
        status: 'queued',
        scanType: 'automated',
      });

      // Process scan (wait for it to complete or run in parallel)
      await processScan(scan._id);
    }

    user.lastAutoScan = new Date();
    await user.save();
  } catch (error) {
    console.error(`[AutoScan] Error for user ${user.githubUsername}:`, error.message);
  }
}, { connection: redisConnection });

scanWorker.on('error', (error) => {
  if (redisAvailable) {
    console.warn('Scan Worker Error:', error.message);
  }
});

// Scheduler Job - check every hour
const scheduleAutoScans = async () => {
  console.log('[Scheduler] Initializing auto-scan scheduler...');

  // Check every hour for users who need scanning
  setInterval(async () => {
    try {
      const users = await User.find({ autoScanEnabled: true });
      const now = new Date();

      for (const user of users) {
        const intervalDays = user.autoScanInterval || 7;
        const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
        const lastScanTime = user.lastAutoScan ? new Date(user.lastAutoScan).getTime() : 0;

        if (now.getTime() - lastScanTime >= intervalMs) {
          console.log(`[Scheduler] User ${user.githubUsername} is due for a scan. Queuing...`);
          await scanQueue.add(`autoscan-${user._id}-${now.getTime()}`, { userId: user._id });
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error in check loop:', error.message);
    }
  }, 3600000); // 1 hour
};

module.exports = { scheduleAutoScans, scanQueue };
