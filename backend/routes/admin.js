const express = require('express');
const userController = require('../controllers/userController');
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication and admin requirements to all routes
router.use(authenticateToken);
router.use(requireAdmin);
router.use(generalLimiter);

// Admin-only routes
router.get('/stats', userController.getSystemStats);

// Admin: users
router.get('/users', userController.getAllUsers);
router.put('/users/:userId/role', userController.updateUserRole);
router.delete('/users/:userId', userController.deleteUser);

// Admin: transactions
router.get('/transactions', transactionController.getAllTransactions);
router.post('/transactions', transactionController.createTransactionAdmin);
router.put('/transactions/:id', transactionController.updateTransactionAdmin);
router.delete('/transactions/:id', transactionController.deleteTransactionAdmin);

module.exports = router;
