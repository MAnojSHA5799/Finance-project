const rateLimit = require('express-rate-limit');

// Auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Transaction endpoints: 100 requests per hour
const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many transaction requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics endpoints: 50 requests per hour
const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many analytics requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API endpoints: 200 requests per hour
const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  transactionLimiter,
  analyticsLimiter,
  generalLimiter
};
