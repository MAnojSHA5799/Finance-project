const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin, requireAnyRole, requireUserOrAdmin } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(generalLimiter);

// Validation rules
const updateProfileValidation = [
  body('first_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('last_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

const updateRoleValidation = [
  body('role')
    .isIn(['admin', 'user', 'read-only'])
    .withMessage('Invalid role')
];

// User profile routes
// Read-only users can view profile but cannot update it
router.get('/profile', requireAnyRole, userController.getProfile);
router.put('/profile', requireUserOrAdmin, updateProfileValidation, userController.updateProfile);

// Admin-only routes
router.get('/', requireAdmin, userController.getAllUsers);
router.put('/:userId/role', requireAdmin, updateRoleValidation, userController.updateUserRole);
router.delete('/:userId', requireAdmin, userController.deleteUser);

module.exports = router;
