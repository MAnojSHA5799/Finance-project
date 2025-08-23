const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireAdmin, requireAnyRole } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(generalLimiter);

// Validation rules
const categoryValidation = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon must be less than 50 characters')
];

// Routes accessible to all roles (read-only users can view)
router.get('/', requireAnyRole, categoryController.getCategories);
router.get('/:id', requireAnyRole, categoryController.getCategory);
router.get('/stats/user', requireAnyRole, categoryController.getCategoryStats);

// Admin-only routes for category management
router.post('/', requireAdmin, categoryValidation, categoryController.createCategory);
router.put('/:id', requireAdmin, categoryValidation, categoryController.updateCategory);
router.delete('/:id', requireAdmin, categoryController.deleteCategory);

module.exports = router;
