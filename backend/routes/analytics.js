const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(analyticsLimiter);

// All analytics routes are accessible to all roles (including read-only)
router.get('/dashboard', requireAnyRole, analyticsController.getUserAnalytics);
router.get('/global', requireAnyRole, analyticsController.getGlobalAnalytics);
router.get('/categories', requireAnyRole, analyticsController.getCategoryAnalytics);
router.get('/trends', requireAnyRole, analyticsController.getSpendingTrends);

module.exports = router;
