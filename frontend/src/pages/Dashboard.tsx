import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  ArrowUpIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { AnalyticsData } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const isGlobal = user?.role === 'admin' || user?.role === 'read-only';
      const response = isGlobal
        ? await apiService.getGlobalAnalytics(period, year, month)
        : await apiService.getAnalytics(period, year, month);
      setAnalytics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period, year, month]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const expenseChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.categoryBreakdown
      .filter(item => item.type === 'expense')
      .map(item => ({
        name: item.category,
        value: item.total,
        color: item.color
      }));
  }, [analytics]);

  const lineChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.monthlyTrends.map(item => ({
      name: item.monthName,
      income: item.income,
      expenses: item.expenses,
      net: item.net
    }));
  }, [analytics]);

  const formatCurrency = (amount: number) => {
    // Handle blank, null, undefined, or NaN values by showing zero
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(safeAmount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Render welcome message based on user role
  const renderWelcomeMessage = () => {
    const userName = user?.first_name || user?.username;
    
    if (user?.role === 'admin') {
      return (
        <div className="flex items-center">
          <div className="mr-3 text-red-600 dark:text-red-400">
            <ShieldCheckIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {userName}!
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You have full administrative access to manage users and system settings.
            </p>
          </div>
        </div>
      );
    }
    
    if (user?.role === 'read-only') {
      return (
        <div className="flex items-center">
          <div className="mr-3 text-yellow-600 dark:text-yellow-400">
            <UserGroupIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {userName}!
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You have read-only access. You can view data but cannot make changes.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <div className="mr-3 text-blue-600 dark:text-blue-400">
          <ChartBarIcon className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's an overview of your financial activity
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {renderWelcomeMessage()}
          
          {/* Period selector */}
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input w-auto"
            >
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Role-specific notice for read-only users */}
        {user?.role === 'read-only' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex">
              <UserGroupIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Read-Only Access
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  You can view all financial data and analytics, but you cannot add, edit, or delete transactions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admin-specific notice */}
        {user?.role === 'admin' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="flex">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Administrative Access
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  You have full access to manage users, view system statistics, and configure system settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
  {/* Total Income */}
  <div className="card">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <CurrencyDollarIcon className="h-8 w-8 text-success-600" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Income
        </p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(analytics.summary.totalIncome) || '$0'}
        </p>
      </div>
    </div>
  </div>

  {/* Total Expenses */}
  <div className="card">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <ArrowTrendingDownIcon className="h-8 w-8 text-danger-600" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Expenses
        </p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(analytics.summary.totalExpenses)}
        </p>
      </div>
    </div>
  </div>

  {/* Net Income */}
  <div className="card">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <ArrowTrendingUpIcon
          className={`h-8 w-8 ${
            analytics.summary.netIncome >= 0
              ? 'text-success-600'
              : 'text-danger-600'
          }`}
        />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Net Income
        </p>
        <p
          className={`text-2xl font-semibold ${
            analytics.summary.netIncome >= 0
              ? 'text-success-600'
              : 'text-danger-600'
          } dark:text-gray-100`}
        >
          {formatCurrency(analytics.summary.netIncome)}
        </p>
      </div>
    </div>
  </div>

  {/* Savings Rate */}
  <div className="card">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <ArrowUpIcon className="h-8 w-8 text-primary-600" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Savings Rate
        </p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {formatPercentage(analytics.summary.savingsRate)}
        </p>
      </div>
    </div>
  </div>
</div>


        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown */}
          <div className="card">
  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
    Expense Breakdown
  </h3>

  {expenseChartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={expenseChartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${((percent || 0) * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {expenseChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>

        {/* Theme-aware Tooltip */}
        <Tooltip
  formatter={(value) => formatCurrency(Number(value))}
  contentStyle={{
    backgroundColor: document.documentElement.classList.contains("dark")
      ? "#FFFFFF" // dark:bg-gray-800
      : "#FFFFFF", // light:bg-white
    border: "1px solid rgb(236, 239, 245)", // ✅ fixed spacing
    borderRadius: "8px",
    color: document.documentElement.classList.contains("dark")
      ? "#FFFFFF" // dark:text-gray-100
      : "#111827", // light:text-gray-900
  }}
/>

      </PieChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500 dark:text-gray-400">
        No expense data available
      </p>
    </div>
  )}
</div>

        </div>

        {/* Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses Bar Chart */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Comparison Bar Chart */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Category Comparison</h3>
            {analytics.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.categoryBreakdown.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">No category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
          {analytics.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {analytics.recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: transaction.color + '20', color: transaction.color }}
                        >
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
