import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { AnalyticsData } from '../types';
import { 
  ChartBarIcon,
  ChartPieIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

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

  const incomeChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.categoryBreakdown
      .filter(item => item.type === 'income')
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detailed insights into your financial patterns
          </p>
        </div>

        {/* Period Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Time Period
            </h2>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-4 flex space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>
            {period === 'month' && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* Total Income */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Income
        </p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(analytics.summary.totalIncome)}
        </p>
      </div>
    </div>
  </div>

  {/* Total Expenses */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
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

  {/* Net Savings */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <ChartBarIcon className="h-8 w-8 text-blue-500" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Net Savings
        </p>
        <p
          className={`text-2xl font-semibold ${
            analytics.summary.netIncome >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCurrency(analytics.summary.netIncome)}
        </p>
      </div>
    </div>
  </div>

  {/* Savings Rate */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <ChartPieIcon className="h-8 w-8 text-purple-500" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Savings Rate
        </p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {analytics.summary.savingsRate.toFixed(1)}%
        </p>
      </div>
    </div>
  </div>
</div>


            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Trends */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Monthly Trends
                </h3>
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
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Expense Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #FFFFFF',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Income vs Expenses Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Income vs Expenses
                </h3>
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
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Comparison Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Category Comparison
                </h3>
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
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Category Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics.categoryBreakdown.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.type === 'income' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {analytics.summary.totalIncome + analytics.summary.totalExpenses > 0 
                            ? ((item.total / (analytics.summary.totalIncome + analytics.summary.totalExpenses)) * 100).toFixed(1)
                            : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
