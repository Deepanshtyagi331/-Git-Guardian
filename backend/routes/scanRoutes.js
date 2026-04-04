const express = require('express');
const router = express.Router();
const { createScan, getScans, getScan, cancelScan, fetchGithubRepos } = require('../controllers/scanController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getScans).post(protect, createScan);
router.get('/github-repos/:username', protect, fetchGithubRepos);
router.route('/:id').get(protect, getScan);
router.post('/:id/cancel', protect, cancelScan);

module.exports = router;
