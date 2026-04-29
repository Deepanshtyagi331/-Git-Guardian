const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const Scan = require('../models/Scan');
const execPromise = util.promisify(exec);

// Maximum file size to scan (1 MB) — skip anything larger
const MAX_FILE_SIZE = 1 * 1024 * 1024;

// Clone timeout: 5 minutes (300 000 ms) — enough for most large repos
const CLONE_TIMEOUT = 300_000;

// Maximum buffer for clone stdout/stderr (50 MB)
const CLONE_MAX_BUFFER = 50 * 1024 * 1024;

// File extensions we care about scanning
const SCANNABLE_EXTENSIONS = new Set([
  // Web / JS
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte',
  // Config / Data
  '.env', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  // Python
  '.py', '.pyw',
  // Ruby
  '.rb', '.erb',
  // Go
  '.go',
  // PHP
  '.php',
  // Java / Kotlin / Scala
  '.java', '.kt', '.kts', '.scala',
  // C / C++ / C#
  '.c', '.cpp', '.cc', '.h', '.hpp', '.cs',
  // Rust
  '.rs',
  // Swift
  '.swift',
  // Shell
  '.sh', '.bash', '.zsh', '.fish',
  // Misc
  '.sql', '.graphql', '.gql', '.tf', '.hcl',
  '.xml', '.properties', '.gradle',
  '.dockerfile', '.env.local', '.env.production', '.env.development',
  // Markdown / Docs (can contain secrets in examples)
  '.md', '.txt', '.rst',
]);

// Files with no extension that should be scanned
const SCANNABLE_FILENAMES = new Set([
  'Dockerfile', 'Makefile', 'Gemfile', 'Rakefile',
  '.env', '.gitignore', '.dockerignore', '.htaccess',
  'docker-compose.yml', 'docker-compose.yaml',
]);

// Directories to always skip
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'vendor', 'venv', '.venv',
  '__pycache__', '.tox', '.mypy_cache', '.pytest_cache',
  'dist', 'build', '.next', '.nuxt', 'out',
  'coverage', '.nyc_output',
  'target', 'bin', 'obj',
  '.gradle', '.idea', '.vscode',
  'Pods', '.dart_tool',
]);

// --- Pattern factories (return new RegExp each call to avoid lastIndex bugs) ---
const createPatterns = () => ({
  // Cloud keys
  aws_access_key: /(?<![A-Z0-9])AKIA[0-9A-Z]{16}(?![A-Z0-9])/,
  aws_secret_key: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/,
  gcp_api_key: /AIza[0-9A-Za-z\-_]{35}/,
  gcp_service_account: /"type"\s*:\s*"service_account"/,

  // Tokens
  github_token: /gh[pousr]_[A-Za-z0-9_]{36,255}/,
  gitlab_token: /glpat-[A-Za-z0-9\-]{20,}/,
  slack_token: /xox[baprs]-[0-9A-Za-z\-]{10,}/,
  slack_webhook: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/,
  jwt_hardcoded: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/,
  npm_token: /\/\/registry\.npmjs\.org\/:_authToken=.+/,

  // Generic secrets — key/value patterns
  generic_api_key: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"][A-Za-z0-9\-_]{16,}['"]/i,
  generic_secret: /(?:secret|token|password|passwd|pwd|credential)\s*[:=]\s*['"][^'"]{8,}['"]/i,
  connection_string: /(?:mongodb(\+srv)?|postgres|mysql|redis|amqp):\/\/[^\s'"]+/i,

  // Crypto / Keys
  private_key_block: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  private_key_file: /(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)(?:\.pub)?$/,

  // Code quality
  console_log: /console\.log\s*\(/,
  todo_comment: /\/\/\s*TODO:/,
  fixme_comment: /\/\/\s*FIXME:/,
  debugger_stmt: /\bdebugger\b/,
});

// Map pattern name → issue metadata
const PATTERN_META = {
  aws_access_key:    { type: 'security', severity: 'critical', message: 'AWS Access Key ID detected (AKIA...)' },
  aws_secret_key:    { type: 'security', severity: 'critical', message: 'Potential AWS Secret Access Key' },
  gcp_api_key:       { type: 'security', severity: 'critical', message: 'Google Cloud API key detected' },
  gcp_service_account: { type: 'security', severity: 'critical', message: 'GCP service account JSON key detected' },
  github_token:      { type: 'security', severity: 'critical', message: 'GitHub personal access token detected' },
  gitlab_token:      { type: 'security', severity: 'critical', message: 'GitLab personal access token detected' },
  slack_token:       { type: 'security', severity: 'high', message: 'Slack API token detected' },
  slack_webhook:     { type: 'security', severity: 'high', message: 'Slack webhook URL detected' },
  jwt_hardcoded:     { type: 'security', severity: 'high', message: 'Hardcoded JWT token found' },
  npm_token:         { type: 'security', severity: 'critical', message: 'NPM auth token detected' },
  generic_api_key:   { type: 'security', severity: 'high', message: 'Hardcoded API key/secret detected' },
  generic_secret:    { type: 'security', severity: 'high', message: 'Hardcoded secret/password/token detected' },
  connection_string: { type: 'security', severity: 'critical', message: 'Database/service connection string with credentials' },
  private_key_block: { type: 'security', severity: 'critical', message: 'Private key block found in source' },
  private_key_file:  { type: 'security', severity: 'critical', message: 'Private key file committed to repo' },
  console_log:       { type: 'code_quality', severity: 'low', message: 'console.log statement found' },
  todo_comment:      { type: 'code_quality', severity: 'low', message: 'TODO comment found' },
  fixme_comment:     { type: 'code_quality', severity: 'medium', message: 'FIXME comment found' },
  debugger_stmt:     { type: 'code_quality', severity: 'medium', message: 'debugger statement found' },
};

// ---------- Helpers ----------

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

/**
 * Check if a buffer looks like binary data (contains null bytes).
 */
const isBinaryBuffer = (buffer) => {
  // Check the first 8KB for null bytes
  const checkLen = Math.min(buffer.length, 8192);
  for (let i = 0; i < checkLen; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
};

/**
 * Determine if a file should be scanned based on extension/name.
 */
const shouldScanFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  // Always scan known config filenames
  if (SCANNABLE_FILENAMES.has(basename)) return true;

  // Scan .env variants (.env.local, .env.production, etc.)
  if (basename.startsWith('.env')) return true;

  // Scan by extension
  if (SCANNABLE_EXTENSIONS.has(ext)) return true;

  return false;
};

/**
 * Recursively collect files, skipping ignored directories.
 */
const getFiles = async (dir) => {
  let results = [];
  let dirents;

  try {
    dirents = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`[Scan Service] Cannot read directory ${dir}: ${err.message}`);
    return results;
  }

  for (const dirent of dirents) {
    const fullPath = path.resolve(dir, dirent.name);

    if (dirent.isDirectory()) {
      if (SKIP_DIRS.has(dirent.name)) continue;
      const nested = await getFiles(fullPath);
      results = results.concat(nested);
    } else if (dirent.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
};

/**
 * Scan a single line of content against all patterns.
 */
const scanLine = (line, lineNumber, filename, patterns) => {
  const issues = [];

  for (const [name, regex] of Object.entries(patterns)) {
    if (regex.test(line)) {
      const meta = PATTERN_META[name];
      if (meta) {
        issues.push({
          type: meta.type,
          severity: meta.severity,
          message: meta.message,
          file: filename,
          line: lineNumber,
        });
      }
    }
  }

  return issues;
};

/**
 * Scan file content string.
 */
const scanContent = (content, filename) => {
  const issues = [];
  const lines = content.split('\n');
  // Create fresh patterns for this file (avoids lastIndex issues with /g)
  const patterns = createPatterns();

  for (let i = 0; i < lines.length; i++) {
    const lineIssues = scanLine(lines[i], i + 1, filename, patterns);
    issues.push(...lineIssues);
  }

  return issues;
};

// ---------- Main Scan Processor ----------

const processScan = async (scanId) => {
  console.log(`[Scan Service] Protocol Initiated: ${scanId}`);
  let scan = await Scan.findById(scanId);
  if (!scan) return;

  // Normalize URL
  let normalizedUrl = scan.repoUrl.trim();
  if (
    normalizedUrl.includes('github.com') ||
    normalizedUrl.includes('gitlab.com') ||
    normalizedUrl.includes('bitbucket.org')
  ) {
    if (
      !normalizedUrl.startsWith('http://') &&
      !normalizedUrl.startsWith('https://') &&
      !normalizedUrl.startsWith('git@')
    ) {
      console.log(`[Scan Service] Normalizing URL: ${normalizedUrl} -> https://${normalizedUrl}`);
      normalizedUrl = `https://${normalizedUrl}`;
    }
  }

  // Strip trailing .git if present (some URLs break without it, some with; normalize)
  const cloneUrl = normalizedUrl.endsWith('.git') ? normalizedUrl : `${normalizedUrl}.git`;

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
    await sleep(500);

    // ---- 1. Clone Repository ----
    // Use partial clone (--filter=blob:limit=2m) to skip huge binary blobs
    // and --depth 1 for shallow history. This dramatically reduces download size.
    console.log(`[Scan Service] Fetching source: ${normalizedUrl}`);
    if (await checkStatus() === 'failed') throw new Error('STOPPED');

    let cloneSuccess = false;
    const cloneCommands = [
      // Try 1: partial clone with blob filter (best for large repos)
      `git clone --depth 1 --filter=blob:limit=2m --no-checkout ${cloneUrl} . && git checkout`,
      // Try 2: standard shallow clone without filter (wider git compatibility)
      `git clone --depth 1 ${cloneUrl} .`,
      // Try 3: without .git suffix
      `git clone --depth 1 ${normalizedUrl} .`,
    ];

    for (let i = 0; i < cloneCommands.length; i++) {
      if (cloneSuccess) break;

      try {
        console.log(`[Scan Service] Clone attempt ${i + 1}/${cloneCommands.length}`);
        // Clean temp dir between retries
        if (i > 0) {
          await safeRm(tempDir);
          await fs.mkdir(tempDir, { recursive: true });
          await sleep(500);
        }

        await execPromise(cloneCommands[i], {
          cwd: tempDir,
          timeout: CLONE_TIMEOUT,
          maxBuffer: CLONE_MAX_BUFFER,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
        cloneSuccess = true;
        console.log(`[Scan Service] Clone succeeded on attempt ${i + 1}`);
      } catch (err) {
        console.warn(`[Scan Service] Clone attempt ${i + 1} failed: ${err.message.slice(0, 200)}`);
        if (i === cloneCommands.length - 1) {
          throw new Error(
            `Git clone failed after ${cloneCommands.length} strategies. ` +
            `Ensure the repository is public and the URL is correct. ` +
            `Last error: ${err.message.slice(0, 300)}`
          );
        }
      }
    }

    if (await checkStatus() === 'failed') throw new Error('STOPPED');

    // ---- 2. Discover Files ----
    const allFiles = await getFiles(tempDir);
    const filesToScan = allFiles.filter(f => shouldScanFile(f));

    console.log(`[Scan Service] Found ${allFiles.length} total files, ${filesToScan.length} targets to scan.`);

    const issues = [];
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    let scannedCount = 0;
    let skippedLarge = 0;
    let skippedBinary = 0;

    // ---- 3. Scan Files in Chunks ----
    const CHUNK_SIZE = 50;
    for (let i = 0; i < filesToScan.length; i += CHUNK_SIZE) {
      if (await checkStatus() === 'failed') throw new Error('STOPPED');

      const chunk = filesToScan.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (filePath) => {
          const relativePath = path.relative(tempDir, filePath);

          // Special handling for .env files — flag the file itself
          if (path.basename(filePath).startsWith('.env')) {
            issues.push({
              type: 'security',
              severity: 'critical',
              message: 'Environment file (.env) detected in repository — should be in .gitignore',
              file: relativePath,
              line: 0,
            });
            stats.critical++;
            // Still scan its contents for additional secrets
          }

          try {
            // Check file size first
            const fileStat = await fs.stat(filePath);
            if (fileStat.size > MAX_FILE_SIZE) {
              skippedLarge++;
              return;
            }

            // Read as buffer first to check for binary
            const buffer = await fs.readFile(filePath);
            if (isBinaryBuffer(buffer)) {
              skippedBinary++;
              return;
            }

            const content = buffer.toString('utf-8');
            const fileIssues = scanContent(content, relativePath);
            fileIssues.forEach((issue) => {
              issues.push(issue);
              stats[issue.severity]++;
            });
            scannedCount++;
          } catch (err) {
            // Permission denied, encoding issues, etc. — skip gracefully
            if (err.code !== 'ENOENT') {
              console.warn(`[Scan Service] Read skip (${relativePath}): ${err.message.slice(0, 100)}`);
            }
          }
        })
      );

      // Progress log every 100 files
      if ((i + CHUNK_SIZE) % 100 === 0 || i + CHUNK_SIZE >= filesToScan.length) {
        console.log(
          `[Scan Service] Progress: ${Math.min(i + CHUNK_SIZE, filesToScan.length)}/${filesToScan.length} files processed`
        );
      }
    }

    console.log(
      `[Scan Service] Scan complete — ` +
      `${scannedCount} scanned, ${skippedLarge} skipped (too large), ${skippedBinary} skipped (binary), ` +
      `${issues.length} issues found`
    );

    // ---- 4. Cleanup ----
    await sleep(500);
    await safeRm(tempDir).catch((err) =>
      console.error(`[Scan Service] Teardown Warning: ${err.message}`)
    );

    if (await checkStatus() === 'failed') return;

    scan.results = { issues, stats };
    scan.status = 'completed';
    await scan.save();
    console.log(`[Scan Service] Protocol Complete: ${scanId}`);
  } catch (error) {
    if (error.message === 'STOPPED') {
      console.log(`[Scan Service] Protocol Aborted: ${scanId}`);
      await sleep(500);
      await safeRm(tempDir).catch(() => {});
      return;
    }

    console.error(`[Scan Service] Terminal Failure for ${scanId}: ${error.message}`);
    await sleep(500);
    await safeRm(tempDir).catch(() => {});

    scan.status = 'failed';
    scan.error = error.message;
    await scan.save();
  }
};

module.exports = { processScan };
