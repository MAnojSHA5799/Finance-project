const pool = require('../config/database');
const cache = require('../utils/cache');

class CategoryController {
  // Get all categories with caching
  async getCategories(req, res) {
    try {
      const { type } = req.query;

      // Try to get from cache first
      const cacheKey = type ? `categories:${type}` : 'categories:all';
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true
        });
      }

      let query = 'SELECT id, name, type, color, icon FROM categories';
      let queryParams = [];

      if (type) {
        query += ' WHERE type = $1';
        queryParams.push(type);
      }

      query += ' ORDER BY name';

      const result = await pool.query(query, queryParams);

      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
        icon: row.icon
      }));

      // Cache the result for 1 hour
      await cache.set(cacheKey, categories, 3600);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get single category
  async getCategory(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT id, name, type, color, icon FROM categories WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new category (admin only)
  async createCategory(req, res) {
    try {
      const { name, type, color, icon } = req.body;

      // Validate required fields
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Name and type are required'
        });
      }

      // Validate type
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either income or expense'
        });
      }

      // Check if category already exists
      const existingCategory = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND type = $2',
        [name, type]
      );

      if (existingCategory.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category already exists'
        });
      }

      const newCategory = await pool.query(
        'INSERT INTO categories (name, type, color, icon) VALUES ($1, $2, $3, $4) RETURNING id, name, type, color, icon',
        [name, type, color || '#3B82F6', icon]
      );

      // Invalidate cache
      await cache.invalidateCategories();

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: newCategory.rows[0]
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update category (admin only)
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, type, color, icon } = req.body;

      // Check if category exists
      const existingCategory = await pool.query(
        'SELECT id FROM categories WHERE id = $1',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Validate type if provided
      if (type && !['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either income or expense'
        });
      }

      // Check if name already exists for the same type
      if (name) {
        const duplicateCategory = await pool.query(
          'SELECT id FROM categories WHERE name = $1 AND type = $2 AND id != $3',
          [name, type || 'expense', id]
        );

        if (duplicateCategory.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Category name already exists for this type'
          });
        }
      }

      const updatedCategory = await pool.query(
        'UPDATE categories SET name = COALESCE($1, name), type = COALESCE($2, type), color = COALESCE($3, color), icon = COALESCE($4, icon) WHERE id = $5 RETURNING id, name, type, color, icon',
        [name, type, color, icon, id]
      );

      // Invalidate cache
      await cache.invalidateCategories();

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory.rows[0]
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete category (admin only)
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Check if category exists
      const existingCategory = await pool.query(
        'SELECT id FROM categories WHERE id = $1',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category is being used by any transactions
      const usedCategory = await pool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1',
        [id]
      );

      if (parseInt(usedCategory.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category that is being used by transactions'
        });
      }

      await pool.query('DELETE FROM categories WHERE id = $1', [id]);

      // Invalidate cache
      await cache.invalidateCategories();

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get category statistics for a user
  async getCategoryStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month', year, month } = req.query;

      let dateFilter = '';
      let queryParams = [userId];

      if (period === 'year' && year) {
        dateFilter = 'AND EXTRACT(YEAR FROM t.date) = $2';
        queryParams.push(year);
      } else if (period === 'month' && year && month) {
        dateFilter = 'AND EXTRACT(YEAR FROM t.date) = $2 AND EXTRACT(MONTH FROM t.date) = $3';
        queryParams.push(year, month);
      }

      const query = `
        SELECT 
          c.id,
          c.name as category_name,
          c.color as category_color,
          c.type,
          SUM(t.amount) as total,
          COUNT(*) as count,
          AVG(t.amount) as average,
          MIN(t.amount) as min_amount,
          MAX(t.amount) as max_amount
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 ${dateFilter}
        GROUP BY c.id, c.name, c.color, c.type
        ORDER BY total DESC
      `;

      const result = await pool.query(query, queryParams);

      const stats = result.rows.map(row => ({
        id: row.id,
        name: row.category_name || 'Uncategorized',
        color: row.category_color || '#6B7280',
        type: row.type,
        total: parseFloat(row.total),
        count: parseInt(row.count),
        average: parseFloat(row.average),
        minAmount: parseFloat(row.min_amount),
        maxAmount: parseFloat(row.max_amount)
      }));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new CategoryController();
