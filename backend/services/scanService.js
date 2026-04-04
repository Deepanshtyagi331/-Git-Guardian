const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const Scan = require('../models/Scan');
const execPromise = util.promisify(exec);

// Regex patterns for security scanning
const PATTERNS = {
  aws_key: /(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])/g,
  aws_secret: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
  jwt: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
  generic_api_key: /api_key\s*[:=]\s*['"][A-Za-z0-9-_]{20,}['"]/gi,
  private_key: /-----BEGIN PRIVATE KEY-----/g,
  console_log: /console\.log\s*\(/g,
  todo: /\/\/\s*TODO:/g,
};

const scanContent = (content, filename) => {
  const issues = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Security Checks
    if (PATTERNS.aws_key.test(line)) {
      issues.push({ type: 'security', severity: 'critical', message: 'Potential AWS Access Key found', file: filename, line: lineNumber });
    }
    if (PATTERNS.aws_secret.test(line)) {
      issues.push({ type: 'security', severity: 'critical', message: 'Potential AWS Secret Key found', file: filename, line: lineNumber });
    }
    if (PATTERNS.jwt.test(line)) {
      issues.push({ type: 'security', severity: 'high', message: 'Hardcoded JWT Token found', file: filename, line: lineNumber });
    }
    if (PATTERNS.private_key.test(line)) {
      issues.push({ type: 'security', severity: 'critical', message: 'Private Key block found', file: filename, line: lineNumber });
    }

    // Code Quality
    if (PATTERNS.console_log.test(line)) {
      issues.push({ type: 'code_quality', severity: 'low', message: 'console.log statement found', file: filename, line: lineNumber });
    }
    if (PATTERNS.todo.test(line)) {
      issues.push({ type: 'code_quality', severity: 'low', message: 'TODO comment found', file: filename, line: lineNumber });
    }
  });

  return issues;
};

const getFiles = async (dir) => {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name === '.git' || dirent.name === 'node_modules') return [];
      return getFiles(res);
    }
    return res;
  }));
  return Array.prototype.concat(...files);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const safeRm = async (dir, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (err.code === 'EBUSY' && i < retries - 1) {
        console.log(`Resource busy, retrying cleanup (${i + 1}/${retries})...`);
        await sleep(1000 * (i + 1));
      } else if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }
};

const processScan = async (scanId) => {
  console.log(`[Scan Service] Protocol Initiated: ${scanId}`);
  let scan = await Scan.findById(scanId);
  if (!scan) return;

  // Normalize URL: Ensure it starts with https:// if it looks like a GitHub/GitLab URL
  let normalizedUrl = scan.repoUrl.trim();
  if (normalizedUrl.includes('github.com') || normalizedUrl.includes('gitlab.com') || normalizedUrl.includes('bitbucket.org')) {
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('git@')) {
      console.log(`[Scan Service] Normalizing URL: ${normalizedUrl} -> https://${normalizedUrl}`);
      normalizedUrl = `https://${normalizedUrl}`;
    }
  }

  const tempDir = path.join(__dirname, '../temp', scanId.toString());

  const checkStatus = async () => {
    const currentScan = await Scan.findById(scanId);
    return currentScan ? currentScan.status : 'failed';
  };

  try {
    scan.status = 'scanning';
    await scan.save();

    console.log(`[Scan Service] Pre-scan cleanup for node: ${scanId}`);
    await safeRm(tempDir);
    await fs.mkdir(tempDir, { recursive: true });

    // Windows filesystem cooldown
    await sleep(1000);

    // 1. Clone Repository with Retry and env protection
    console.log(`[Scan Service] Fetching source: ${normalizedUrl}`);
    if (await checkStatus() === 'failed') throw new Error('STOPPED');

    let cloneSuccess = false;
    for (let i = 0; i < 3; i++) {
      try {
        // Use GIT_TERMINAL_PROMPT=0 to prevent hanging on private repos
        await execPromise(`git clone --depth 1 ${normalizedUrl} .`, {
          cwd: tempDir,
          timeout: 60000,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });
        cloneSuccess = true;
        break;
      } catch (err) {
        console.warn(`[Scan Service] Connection attempt ${i + 1} failed for ${scanId}: ${err.message}`);
        if (i < 2) await sleep(2000);
        else throw new Error(`Git clone failed after ${i + 1} attempts. Ensure repository is public and URL is correct.`);
      }
    }

    if (await checkStatus() === 'failed') throw new Error('STOPPED');

    // 2. Find Files
    const allFiles = await getFiles(tempDir);
    const filesToScan = allFiles.filter(f => /\.(js|jsx|ts|tsx|env|json|py|go|rb|php|java|cs|c|cpp|h|sh|yml|yaml)$/.test(f));

    console.log(`[Scan Service] Indexing complete: ${filesToScan.length} targets identified.`);

    const issues = [];
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };

    // 3. Scan Content - Process in chunks for performance
    const CHUNK_SIZE = 25;
    for (let i = 0; i < filesToScan.length; i += CHUNK_SIZE) {
      if (await checkStatus() === 'failed') throw new Error('STOPPED');

      const chunk = filesToScan.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (filePath) => {
        const relativePath = path.relative(tempDir, filePath);

        if (filePath.endsWith('.env')) {
          issues.push({
            type: 'security',
            severity: 'critical',
            message: 'Environment configuration file (.env) detected in repository structure.',
            file: relativePath,
            line: 0
          });
          stats.critical++;
          return;
        }

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const fileIssues = scanContent(content, relativePath);
          fileIssues.forEach(issue => {
            issues.push(issue);
            stats[issue.severity]++;
          });
        } catch (err) {
          console.error(`[Scan Service] Read Failure (${relativePath}):`, err.message);
        }
      }));
    }

    // 4. Cleanup with cooling period
    await sleep(1000);
    await safeRm(tempDir).catch(err => console.error(`[Scan Service] Teardown Warning: ${err.message}`));

    if (await checkStatus() === 'failed') return;

    scan.results = { issues, stats };
    scan.status = 'completed';
    await scan.save();
    console.log(`[Scan Service] Protocol Complete: ${scanId}`);

  } catch (error) {
    if (error.message === 'STOPPED') {
      console.log(`[Scan Service] Protocol Aborted: ${scanId}`);
      await sleep(500);
      await safeRm(tempDir).catch(() => { });
      return;
    }

    console.error(`[Scan Service] Terminal Failure for ${scanId}: ${error.message}`);
    await sleep(500);
    await safeRm(tempDir).catch(() => { });

    scan.status = 'failed';
    scan.error = error.message;
    await scan.save();
  }
};

module.exports = { processScan };
