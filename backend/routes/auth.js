const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('first_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('last_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'user', 'read-only'])
    .withMessage('Invalid role')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

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

// Routes
router.post('/register', authLimiter, registerValidation, userController.register);
router.post('/login', authLimiter, loginValidation, userController.login);

module.exports = router;
