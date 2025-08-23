const express = require('express');
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireUserOrAdmin, requireAnyRole } = require('../middleware/auth');
const { transactionLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(transactionLimiter);

// Validation rules
const transactionValidation = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
];

// Routes accessible to all roles (read-only users can view)
router.get('/', requireAnyRole, transactionController.getTransactions);
router.get('/:id', requireAnyRole, transactionController.getTransaction);

// Routes restricted to admin and user roles (read-only users cannot modify)
router.post('/', requireUserOrAdmin, transactionValidation, transactionController.createTransaction);
router.put('/:id', requireUserOrAdmin, transactionValidation, transactionController.updateTransaction);
router.delete('/:id', requireUserOrAdmin, transactionController.deleteTransaction);

module.exports = router;
