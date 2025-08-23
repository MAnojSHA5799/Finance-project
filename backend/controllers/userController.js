const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

class UserController {
  // Register new user
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { username, email, password, first_name, last_name, role = 'user' } = req.body;

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await pool.query(
        'INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role',
        [username, email, passwordHash, first_name, last_name, role]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.rows[0].id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: newUser.rows[0],
          token
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await pool.query(
        'SELECT id, username, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
        [email]
      );

      if (user.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const userData = user.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last_login if column exists
      try {
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userData.id]);
      } catch (e) {
        // Column might not exist; ignore
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: userData.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Remove password from response
      delete userData.password_hash;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await pool.query(
        'SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user.rows[0]
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      // Disallow updates from read-only users at controller level as an extra safeguard
      if (req.user?.role === 'read-only') {
        return res.status(403).json({
          success: false,
          message: 'Read-only users cannot modify profile'
        });
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { first_name, last_name, email } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, userId]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Email already taken'
          });
        }
      }

      // Update user
      const updatedUser = await pool.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), email = COALESCE($3, email) WHERE id = $4 RETURNING id, username, email, first_name, last_name, role, created_at',
        [first_name, last_name, email, userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser.rows[0]
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const users = await pool.query(
        'SELECT id, username, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC'
      );

      res.json({
        success: true,
        data: users.rows
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user role (admin only)
  async updateUserRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['admin', 'user', 'read-only'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      // Update user role
      const updatedUser = await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, first_name, last_name, role, created_at',
        [role, userId]
      );

      if (updatedUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: updatedUser.rows[0]
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get system statistics (admin only)
  async getSystemStats(req, res) {
    try {
      // Get total users count
      const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
      const totalUsers = parseInt(totalUsersResult.rows[0].count);

      // Get active users (users who have logged in within last 30 days)
      let activeUsers = 0;
      try {
        const activeUsersResult = await pool.query(
          "SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '30 days'"
        );
        activeUsers = parseInt(activeUsersResult.rows[0].count);
      } catch (e) {
        // last_login column might not exist yet
        activeUsers = 0;
      }

      // Get total transactions count
      const totalTransactionsResult = await pool.query('SELECT COUNT(*) FROM transactions');
      const totalTransactions = parseInt(totalTransactionsResult.rows[0].count);

      // Get total categories count
      const totalCategoriesResult = await pool.query('SELECT COUNT(*) FROM categories');
      const totalCategories = parseInt(totalCategoriesResult.rows[0].count);

      // Calculate system uptime (since server start)
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const systemUptime = `${days}d ${hours}h ${minutes}m`;

      // Get database size (approximate)
      const dbSizeResult = await pool.query(
        "SELECT pg_size_pretty(pg_database_size(current_database())) AS size"
      );
      const databaseSize = dbSizeResult.rows[0].size || 'Unknown';

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalTransactions,
          totalCategories,
          systemUptime,
          databaseSize
        }
      });
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const adminUserId = req.user.id;

      // Prevent admin from deleting themselves
      if (parseInt(userId) === adminUserId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      // Check if user exists
      const userExists = await pool.query(
        'SELECT id, username FROM users WHERE id = $1',
        [userId]
      );

      if (userExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete user (this will cascade delete their transactions due to foreign key constraint)
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();
