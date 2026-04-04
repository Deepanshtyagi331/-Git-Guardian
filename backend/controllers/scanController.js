const Scan = require('../models/Scan');
const ActivityLog = require('../models/ActivityLog');
const { processScan } = require('../services/scanService');
const { Octokit } = require('octokit');

// @desc    Start a new scan
// @route   POST /api/scans
// @access  Private
const createScan = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ message: 'Repo URL is required' });
  }

  try {
    const scan = await Scan.create({
      user: req.user.id,
      repoUrl,
      status: 'queued',
    });

    await ActivityLog.create({
      user: req.user.id,
      action: 'SCAN_CREATED',
      details: repoUrl,
      ipAddress: req.ip
    });

    // Trigger scan asynchronously (simple version)
    // In production, push to BullMQ
    processScan(scan._id).catch(err => console.error(err));

    res.status(201).json(scan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all scans for user
// @route   GET /api/scans
// @access  Private
const getScans = async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single scan
// @route   GET /api/scans/:id
// @access  Private
const getScan = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    if (scan.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(scan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a scan
// @route   POST /api/scans/:id/cancel
// @access  Private
const cancelScan = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    if (scan.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (scan.status === 'completed' || scan.status === 'failed') {
      return res.status(400).json({ message: 'Scan already finished' });
    }

    scan.status = 'failed';
    scan.error = 'Scan terminated by user protocol.';
    await scan.save();

    await ActivityLog.create({
      user: req.user.id,
      action: 'SCAN_CANCELLED',
      details: scan.repoUrl,
      ipAddress: req.ip
    });

    res.json({ message: 'Scan protocol terminated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fetchGithubRepos = async (req, res) => {
  const { username } = req.params;
  console.log(`[GitHub Proxy] Fetching repos for: ${username}`);

  try {
    const rawAuth = process.env.GITHUB_TOKEN || process.env.GITHUB_CLIENT_SECRET;
    const isPlaceholder = !rawAuth || rawAuth.startsWith('your_') || rawAuth.trim() === '';

    const octokit = new Octokit({
      auth: isPlaceholder ? undefined : rawAuth,
      request: { timeout: 7000 }
    });

    const response = await octokit.request('GET /users/{username}/repos', {
      username,
      sort: 'updated',
      per_page: 50
    });

    console.log(`[GitHub Proxy] success: found ${response.data?.length} repos`);
    res.json(response.data);
  } catch (error) {
    console.error(`[GitHub Proxy] Error for ${username}:`, error.message);

    if (error.status === 404) {
      return res.status(404).json({ message: 'GitHub account not found.' });
    }

    if (error.status === 401) {
      return res.status(401).json({ message: 'Authentication failed. Please verify your system credentials.' });
    }

    const status = error.status || 500;
    const message = status === 403
      ? 'GitHub API rate limit exceeded. Falling back to manual entry is recommended.'
      : `Connection Error: ${error.message}`;

    res.status(status).json({ message });
  }
};

module.exports = {
  createScan,
  getScans,
  getScan,
  cancelScan,
  fetchGithubRepos,
};
