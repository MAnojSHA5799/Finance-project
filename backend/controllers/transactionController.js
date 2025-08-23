const pool = require('../config/database');
const cache = require('../utils/cache');
const { body, validationResult } = require('express-validator');

class TransactionController {
  // Admin: Get all transactions across users with filtering and pagination
  async getAllTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category_id,
        user_id,
        start_date,
        end_date,
        search,
        sort_by = 'date',
        sort_order = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          t.id, t.user_id, t.type, t.amount, t.description, t.date, t.created_at,
          c.id as category_id, c.name as category_name, c.color as category_color,
          u.username, u.email
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let i = 0;

      if (type) { i++; query += ` AND t.type = $${i}`; params.push(type); }
      if (category_id) { i++; query += ` AND t.category_id = $${i}`; params.push(category_id); }
      if (user_id) { i++; query += ` AND t.user_id = $${i}`; params.push(user_id); }
      if (start_date) { i++; query += ` AND t.date >= $${i}`; params.push(start_date); }
      if (end_date) { i++; query += ` AND t.date <= $${i}`; params.push(end_date); }
      if (search) { i++; query += ` AND (t.description ILIKE $${i} OR c.name ILIKE $${i} OR u.username ILIKE $${i} OR u.email ILIKE $${i})`; params.push(`%${search}%`); }

      const validSortFields = ['date', 'amount', 'created_at', 'description'];
      const validSortOrders = ['asc', 'desc'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'date';
      const sortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';
      query += ` ORDER BY t.${sortField} ${sortOrder.toUpperCase()}`;

      i++; query += ` LIMIT $${i}`; params.push(limit);
      i++; query += ` OFFSET $${i}`; params.push(offset);

      // Count
      let countQuery = `
        SELECT COUNT(*)
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const countParams = [];
      let ci = 0;
      if (type) { ci++; countQuery += ` AND t.type = $${ci}`; countParams.push(type); }
      if (category_id) { ci++; countQuery += ` AND t.category_id = $${ci}`; countParams.push(category_id); }
      if (user_id) { ci++; countQuery += ` AND t.user_id = $${ci}`; countParams.push(user_id); }
      if (start_date) { ci++; countQuery += ` AND t.date >= $${ci}`; countParams.push(start_date); }
      if (end_date) { ci++; countQuery += ` AND t.date <= $${ci}`; countParams.push(end_date); }
      if (search) { ci++; countQuery += ` AND (t.description ILIKE $${ci} OR c.name ILIKE $${ci} OR u.username ILIKE $${ci} OR u.email ILIKE $${ci})`; countParams.push(`%${search}%`); }

      const [transactions, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, countParams)
      ]);

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          transactions: transactions.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_count: totalCount,
            limit: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Admin get all transactions error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Admin: Update any transaction by id
  async updateTransactionAdmin(req, res) {
    try {
      const { id } = req.params;
      const { type, amount, description, date, category_id } = req.body;

      // Validate category if provided
      if (category_id) {
        const category = await pool.query('SELECT id, type FROM categories WHERE id = $1', [category_id]);
        if (category.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'Invalid category' });
        }
        if (type && category.rows[0].type !== type) {
          return res.status(400).json({ success: false, message: 'Category type does not match transaction type' });
        }
      }

      // Get user_id for cache invalidation
      const existing = await pool.query('SELECT user_id FROM transactions WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      const targetUserId = existing.rows[0].user_id;

      const updated = await pool.query(
        'UPDATE transactions SET type = COALESCE($1, type), amount = COALESCE($2, amount), description = COALESCE($3, description), date = COALESCE($4, date), category_id = COALESCE($5, category_id) WHERE id = $6 RETURNING id, user_id, type, amount, description, date, category_id, created_at',
        [type, amount, description, date, category_id, id]
      );

      await cache.invalidateUserCache(targetUserId);

      res.json({ success: true, message: 'Transaction updated successfully', data: updated.rows[0] });
    } catch (error) {
      console.error('Admin update transaction error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Admin: Delete any transaction by id
  async deleteTransactionAdmin(req, res) {
    try {
      const { id } = req.params;
      const existing = await pool.query('SELECT user_id FROM transactions WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      const targetUserId = existing.rows[0].user_id;
      await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
      await cache.invalidateUserCache(targetUserId);
      res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
      console.error('Admin delete transaction error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Admin: Create transaction for any user
  async createTransactionAdmin(req, res) {
    try {
      const { user_id, type, amount, description, date, category_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ success: false, message: 'user_id is required' });
      }

      // Validate user exists
      const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Target user not found' });
      }

      // Validate category exists and matches type
      if (category_id) {
        const category = await pool.query('SELECT id, type FROM categories WHERE id = $1', [category_id]);
        if (category.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'Invalid category' });
        }
        if (type && category.rows[0].type !== type) {
          return res.status(400).json({ success: false, message: 'Category type does not match transaction type' });
        }
      }

      const created = await pool.query(
        'INSERT INTO transactions (user_id, type, amount, description, date, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id, type, amount, description, date, category_id, created_at',
        [user_id, type, amount, description, date, category_id]
      );

      await cache.invalidateUserCache(user_id);

      res.status(201).json({ success: true, message: 'Transaction created successfully', data: created.rows[0] });
    } catch (error) {
      console.error('Admin create transaction error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  // Get all transactions for a user with filtering and pagination
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 10, 
        type, 
        category_id, 
        start_date, 
        end_date, 
        search,
        sort_by = 'date',
        sort_order = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const filters = { page, limit, type, category_id, start_date, end_date, search, sort_by, sort_order };

      // Try to get from cache first
      const cachedData = await cache.getTransactionList(userId, filters);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true
        });
      }

      // Build query
      let query = `
        SELECT 
          t.id, t.type, t.amount, t.description, t.date, t.created_at,
          c.id as category_id, c.name as category_name, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      `;
      const queryParams = [userId];
      let paramCount = 1;

      // Add filters
      if (type) {
        paramCount++;
        query += ` AND t.type = $${paramCount}`;
        queryParams.push(type);
      }

      if (category_id) {
        paramCount++;
        query += ` AND t.category_id = $${paramCount}`;
        queryParams.push(category_id);
      }

      if (start_date) {
        paramCount++;
        query += ` AND t.date >= $${paramCount}`;
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND t.date <= $${paramCount}`;
        queryParams.push(end_date);
      }

      if (search) {
        paramCount++;
        query += ` AND (t.description ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      // Add sorting
      const validSortFields = ['date', 'amount', 'created_at', 'description'];
      const validSortOrders = ['asc', 'desc'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'date';
      const sortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';
      
      query += ` ORDER BY t.${sortField} ${sortOrder.toUpperCase()}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(limit);
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(offset);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      `;
      const countParams = [userId];
      let countParamCount = 1;

      if (type) {
        countParamCount++;
        countQuery += ` AND t.type = $${countParamCount}`;
        countParams.push(type);
      }

      if (category_id) {
        countParamCount++;
        countQuery += ` AND t.category_id = $${countParamCount}`;
        countParams.push(category_id);
      }

      if (start_date) {
        countParamCount++;
        countQuery += ` AND t.date >= $${countParamCount}`;
        countParams.push(start_date);
      }

      if (end_date) {
        countParamCount++;
        countQuery += ` AND t.date <= $${countParamCount}`;
        countParams.push(end_date);
      }

      if (search) {
        countParamCount++;
        countQuery += ` AND (t.description ILIKE $${countParamCount} OR c.name ILIKE $${countParamCount})`;
        countParams.push(`%${search}%`);
      }

      const [transactions, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      const result = {
        transactions: transactions.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: totalCount,
          limit: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };

      // Cache the result
      await cache.setTransactionList(userId, filters, result);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get single transaction
  async getTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const transaction = await pool.query(
        `SELECT 
          t.id, t.type, t.amount, t.description, t.date, t.created_at,
          c.id as category_id, c.name as category_name, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );

      if (transaction.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction.rows[0]
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new transaction
  async createTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { type, amount, description, date, category_id } = req.body;

      // Validate category exists and matches type
      if (category_id) {
        const category = await pool.query(
          'SELECT id, type FROM categories WHERE id = $1',
          [category_id]
        );

        if (category.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category'
          });
        }

        if (category.rows[0].type !== type) {
          return res.status(400).json({
            success: false,
            message: 'Category type does not match transaction type'
          });
        }
      }

      const newTransaction = await pool.query(
        'INSERT INTO transactions (user_id, type, amount, description, date, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, type, amount, description, date, category_id, created_at',
        [userId, type, amount, description, date, category_id]
      );

      // Invalidate cache
      await cache.invalidateUserCache(userId);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: newTransaction.rows[0]
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update transaction
  async updateTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { id } = req.params;
      const { type, amount, description, date, category_id } = req.body;

      // Check if transaction exists and belongs to user
      const existingTransaction = await pool.query(
        'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existingTransaction.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Validate category if provided
      if (category_id) {
        const category = await pool.query(
          'SELECT id, type FROM categories WHERE id = $1',
          [category_id]
        );

        if (category.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category'
          });
        }

        if (category.rows[0].type !== type) {
          return res.status(400).json({
            success: false,
            message: 'Category type does not match transaction type'
          });
        }
      }

      const updatedTransaction = await pool.query(
        'UPDATE transactions SET type = COALESCE($1, type), amount = COALESCE($2, amount), description = COALESCE($3, description), date = COALESCE($4, date), category_id = COALESCE($5, category_id) WHERE id = $6 AND user_id = $7 RETURNING id, type, amount, description, date, category_id, created_at',
        [type, amount, description, date, category_id, id, userId]
      );

      // Invalidate cache
      await cache.invalidateUserCache(userId);

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: updatedTransaction.rows[0]
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete transaction
  async deleteTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Check if transaction exists and belongs to user
      const existingTransaction = await pool.query(
        'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existingTransaction.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      await pool.query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      // Invalidate cache
      await cache.invalidateUserCache(userId);

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new TransactionController();
