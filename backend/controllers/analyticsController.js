const pool = require('../config/database');
const cache = require('../utils/cache');

class AnalyticsController {
  // Get user analytics with caching
  async getUserAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month', year, month } = req.query;

      // Try to get from cache first
      const cacheKey = `analytics:user:${userId}:${period}:${year}:${month}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true
        });
      }

      let dateFilter = '';
      let queryParams = [userId];

      // Build date filter based on period
      if (period === 'year' && year) {
        dateFilter = 'AND EXTRACT(YEAR FROM t.date) = $2';
        queryParams.push(year);
      } else if (period === 'month' && year && month) {
        dateFilter = 'AND EXTRACT(YEAR FROM t.date) = $2 AND EXTRACT(MONTH FROM t.date) = $3';
        queryParams.push(year, month);
      } else if (period === 'month' && year) {
        dateFilter = 'AND EXTRACT(YEAR FROM t.date) = $2';
        queryParams.push(year);
      }

      // Get total income and expenses
      const totalsQuery = `
        SELECT 
          type,
          SUM(amount) as total,
          COUNT(*) as count
        FROM transactions t
        WHERE user_id = $1 ${dateFilter}
        GROUP BY type
      `;

      const totalsResult = await pool.query(totalsQuery, queryParams);
      
      let totalIncome = 0;
      let totalExpenses = 0;
      let incomeCount = 0;
      let expenseCount = 0;

      totalsResult.rows.forEach(row => {
        if (row.type === 'income') {
          totalIncome = parseFloat(row.total);
          incomeCount = parseInt(row.count);
        } else {
          totalExpenses = parseFloat(row.total);
          expenseCount = parseInt(row.count);
        }
      });

      // Get category breakdown
      const categoryQuery = `
        SELECT 
          c.name as category_name,
          c.color as category_color,
          t.type,
          SUM(t.amount) as total,
          COUNT(*) as count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 ${dateFilter}
        GROUP BY c.name, c.color, t.type
        ORDER BY total DESC
      `;

      const categoryResult = await pool.query(categoryQuery, queryParams);

      // Get monthly trends for the current year
      const currentYear = new Date().getFullYear();
      const trendsQuery = `
        SELECT 
          EXTRACT(MONTH FROM t.date) as month,
          t.type,
          SUM(t.amount) as total
        FROM transactions t
        WHERE t.user_id = $1 AND EXTRACT(YEAR FROM t.date) = $2
        GROUP BY EXTRACT(MONTH FROM t.date), t.type
        ORDER BY month
      `;

      const trendsResult = await pool.query(trendsQuery, [userId, currentYear]);

      // Process trends data
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expenses: 0
      }));

      trendsResult.rows.forEach(row => {
        const monthIndex = parseInt(row.month) - 1;
        if (row.type === 'income') {
          monthlyData[monthIndex].income = parseFloat(row.total);
        } else {
          monthlyData[monthIndex].expenses = parseFloat(row.total);
        }
      });

      // Get recent transactions for quick overview
      const recentQuery = `
        SELECT 
          t.id, t.type, t.amount, t.description, t.date,
          c.name as category_name, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
        ORDER BY t.date DESC
        LIMIT 5
      `;

      const recentResult = await pool.query(recentQuery, [userId]);

      // Calculate net income
      const netIncome = totalIncome - totalExpenses;

      // Calculate savings rate
      const savingsRate = totalIncome > 0 ? parseFloat(((netIncome / totalIncome) * 100).toFixed(2)) : 0;

      const analytics = {
        summary: {
          totalIncome,
          totalExpenses,
          netIncome,
          savingsRate: savingsRate,
          incomeCount,
          expenseCount
        },
        categoryBreakdown: categoryResult.rows.map(row => ({
          category: row.category_name || 'Uncategorized',
          color: row.category_color || '#6B7280',
          type: row.type,
          total: parseFloat(row.total),
          count: parseInt(row.count)
        })),
        monthlyTrends: monthlyData.map(data => ({
          month: data.month,
          monthName: new Date(currentYear, data.month - 1).toLocaleString('default', { month: 'short' }),
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses
        })),
        recentTransactions: recentResult.rows.map(row => ({
          id: row.id,
          type: row.type,
          amount: parseFloat(row.amount),
          description: row.description,
          date: row.date,
          category: row.category_name || 'Uncategorized',
          color: row.category_color || '#6B7280'
        }))
      };

      // Cache the result for 15 minutes
      await cache.set(cacheKey, analytics, 900);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Global analytics (admin and read-only)
  async getGlobalAnalytics(req, res) {
    try {
      const role = req.user?.role;
      if (role !== 'admin' && role !== 'read-only') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const { period = 'month', year, month } = req.query;

      let dateFilter = '';
      const queryParams = [];

      if (period === 'year' && year) {
        dateFilter = 'WHERE EXTRACT(YEAR FROM t.date) = $1';
        queryParams.push(year);
      } else if (period === 'month' && year && month) {
        dateFilter = 'WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2';
        queryParams.push(year, month);
      } else if (period === 'month' && year) {
        dateFilter = 'WHERE EXTRACT(YEAR FROM t.date) = $1';
        queryParams.push(year);
      }

      const totalsQuery = `
        SELECT type, SUM(amount) as total, COUNT(*) as count
        FROM transactions t
        ${dateFilter}
        GROUP BY type
      `;
      const totalsResult = await pool.query(totalsQuery, queryParams);

      let totalIncome = 0, totalExpenses = 0, incomeCount = 0, expenseCount = 0;
      totalsResult.rows.forEach(row => {
        if (row.type === 'income') { totalIncome = parseFloat(row.total); incomeCount = parseInt(row.count); }
        else { totalExpenses = parseFloat(row.total); expenseCount = parseInt(row.count); }
      });

      const categoryQuery = `
        SELECT c.name as category_name, c.color as category_color, t.type, SUM(t.amount) as total, COUNT(*) as count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ${dateFilter}
        GROUP BY c.name, c.color, t.type
        ORDER BY total DESC
      `;
      const categoryResult = await pool.query(categoryQuery, queryParams);

      const currentYear = new Date().getFullYear();
      const trendsQuery = `
        SELECT EXTRACT(MONTH FROM t.date) as month, t.type, SUM(t.amount) as total
        FROM transactions t
        WHERE EXTRACT(YEAR FROM t.date) = $1
        GROUP BY EXTRACT(MONTH FROM t.date), t.type
        ORDER BY month
      `;
      const trendsResult = await pool.query(trendsQuery, [currentYear]);
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expenses: 0 }));
      trendsResult.rows.forEach(row => {
        const idx = parseInt(row.month) - 1;
        if (row.type === 'income') monthlyData[idx].income = parseFloat(row.total);
        else monthlyData[idx].expenses = parseFloat(row.total);
      });

      const recentQuery = `
        SELECT t.id, t.type, t.amount, t.description, t.date, c.name as category_name, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT 5
      `;
      const recentResult = await pool.query(recentQuery);

      const netIncome = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? parseFloat(((netIncome / totalIncome) * 100).toFixed(2)) : 0;

      const analytics = {
        summary: { totalIncome, totalExpenses, netIncome, savingsRate, incomeCount, expenseCount },
        categoryBreakdown: categoryResult.rows.map(row => ({
          category: row.category_name || 'Uncategorized',
          color: row.category_color || '#6B7280',
          type: row.type,
          total: parseFloat(row.total),
          count: parseInt(row.count)
        })),
        monthlyTrends: monthlyData.map(d => ({
          month: d.month,
          monthName: new Date(currentYear, d.month - 1).toLocaleString('default', { month: 'short' }),
          income: d.income,
          expenses: d.expenses,
          net: d.income - d.expenses
        })),
        recentTransactions: recentResult.rows.map(row => ({
          id: row.id,
          type: row.type,
          amount: parseFloat(row.amount),
          description: row.description,
          date: row.date,
          category: row.category_name || 'Uncategorized',
          color: row.category_color || '#6B7280'
        }))
      };

      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('Get global analytics error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get category analytics
  async getCategoryAnalytics(req, res) {
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
          AVG(t.amount) as average
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 ${dateFilter}
        GROUP BY c.id, c.name, c.color, c.type
        ORDER BY total DESC
      `;

      const result = await pool.query(query, queryParams);

      const analytics = result.rows.map(row => ({
        id: row.id,
        name: row.category_name || 'Uncategorized',
        color: row.category_color || '#6B7280',
        type: row.type,
        total: parseFloat(row.total),
        count: parseInt(row.count),
        average: parseFloat(row.average)
      }));

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get category analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get spending trends
  async getSpendingTrends(req, res) {
    try {
      const userId = req.user.id;
      const { months = 6 } = req.query;

      const query = `
        SELECT 
          DATE_TRUNC('month', t.date) as month,
          t.type,
          SUM(t.amount) as total
        FROM transactions t
        WHERE t.user_id = $1 
          AND t.date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${months} months')
        GROUP BY DATE_TRUNC('month', t.date), t.type
        ORDER BY month
      `;

      const result = await pool.query(query, [userId]);

      // Process data for chart
      const monthlyData = {};
      
      result.rows.forEach(row => {
        const monthKey = row.month.toISOString().slice(0, 7); // YYYY-MM format
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            monthName: new Date(row.month).toLocaleString('default', { month: 'short', year: 'numeric' }),
            income: 0,
            expenses: 0
          };
        }
        
        if (row.type === 'income') {
          monthlyData[monthKey].income = parseFloat(row.total);
        } else {
          monthlyData[monthKey].expenses = parseFloat(row.total);
        }
      });

      const trends = Object.values(monthlyData).map(data => ({
        ...data,
        net: data.income - data.expenses
      }));

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Get spending trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AnalyticsController();
