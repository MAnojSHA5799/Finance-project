import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Transaction } from '../types';
import { 
  PlusIcon, 
  FunnelIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  // Add Transaction form state
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    type: 'income' | 'expense' | '';
    amount: string;
    description: string;
    date: string;
    category_id?: number | '';
  }>({
    type: '',
    amount: '',
    description: '',
    date: '',
    category_id: ''
  });
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  // Edit Transaction state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editCategories, setEditCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [editFormData, setEditFormData] = useState<{
    type: 'income' | 'expense' | '';
    amount: string;
    description: string;
    date: string;
    category_id?: number | '';
  }>({
    type: '',
    amount: '',
    description: '',
    date: '',
    category_id: ''
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filters.type) params.type = filters.type as 'income' | 'expense';
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      const isGlobalView = user?.role === 'admin' || user?.role === 'read-only';
      const response = isGlobalView
        ? await apiService.adminGetTransactions(params)
        : await apiService.getTransactions(params);
      setTransactions(response.data.transactions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters, user?.role]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Load categories when type changes in the form
  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (!formData.type) {
          setCategories([]);
          return;
        }
        const res = await apiService.getCategories(formData.type);
        setCategories(res.data.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (e) {
        // ignore category load errors in UI
      }
    };
    loadCategories();
  }, [formData.type]);

  // Load categories for edit form depending on type
  useEffect(() => {
    const loadEditCategories = async () => {
      try {
        if (!editingId || !editFormData.type) {
          setEditCategories([]);
          return;
        }
        const res = await apiService.getCategories(editFormData.type);
        setEditCategories(res.data.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (e) {
        // ignore
      }
    };
    loadEditCategories();
  }, [editingId, editFormData.type]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'category_id' ? (value ? Number(value) : '') : value
    }));
  };

  const resetForm = () => {
    setFormData({ type: '', amount: '', description: '', date: '', category_id: '' });
    setFormError(null);
  };

  const onSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (user?.role === 'read-only') return; // extra guard

    // Basic validation
    if (!formData.type || !formData.amount || !formData.date) {
      setFormError('Type, amount, and date are required');
      return;
    }
    const amountNum = Number(formData.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }

    try {
      setFormLoading(true);
      await apiService.createTransaction({
        type: formData.type as 'income' | 'expense',
        amount: amountNum,
        description: formData.description || undefined,
        date: formData.date,
        category_id: typeof formData.category_id === 'number' ? formData.category_id : undefined,
      });
      setSuccess('Transaction added successfully');
      setShowForm(false);
      resetForm();
      fetchTransactions();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (t: Transaction) => {
    setSuccess(null);
    setEditFormError(null);
    setEditingId(t.id);
    // Normalize date to yyyy-mm-dd for input[type=date]
    const normalizedDate = (() => {
      try {
        const d = new Date(t.date);
        if (!Number.isNaN(d.getTime())) {
          return d.toISOString().slice(0, 10);
        }
      } catch {}
      return (t as any).date?.slice?.(0, 10) || '';
    })();
    setEditFormData({
      type: t.type,
      amount: String(t.amount),
      description: t.description || '',
      date: normalizedDate,
      category_id: (t as any).category_id ?? ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'category_id' ? (value ? Number(value) : '') : value
    }));
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (user?.role === 'read-only') return;
    setEditFormError(null);
    setSuccess(null);
    // Basic validation
    if (!editFormData.type || !editFormData.amount || !editFormData.date) {
      setEditFormError('Type, amount, and date are required');
      return;
    }
    const amountNum = Number(editFormData.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setEditFormError('Amount must be a positive number');
      return;
    }
    try {
      setEditFormLoading(true);
      await apiService.updateTransaction(editingId, {
        type: editFormData.type as 'income' | 'expense',
        amount: amountNum,
        description: editFormData.description || undefined,
        date: editFormData.date,
        category_id: typeof editFormData.category_id === 'number' ? editFormData.category_id : undefined,
      });
      setSuccess('Transaction updated successfully');
      setEditingId(null);
      await fetchTransactions();
    } catch (err: any) {
      setEditFormError(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setEditFormLoading(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    if (user?.role === 'read-only') return;
    const ok = window.confirm('Are you sure you want to delete this transaction?');
    if (!ok) return;
    try {
      await apiService.deleteTransaction(id);
      setSuccess('Transaction deleted successfully');
      await fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and view your financial transactions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h2>
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="End Date"
            />
            <button
              onClick={() => setFilters({ type: '', category: '', startDate: '', endDate: '' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="mb-6">
          <button
            onClick={() => user?.role !== 'read-only' && setShowForm(true)}
            disabled={user?.role === 'read-only'}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              user?.role === 'read-only'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
            title={user?.role === 'read-only' ? 'Read-only users cannot add transactions' : undefined}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Transaction</h2>
            {formError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-red-800 dark:text-red-200">
                {formError}
              </div>
            )}
            <form onSubmit={onSubmitTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Describe this transaction"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category (optional)</label>
                <select
                  name="category_id"
                  value={formData.category_id ?? ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={!formData.type}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {!formData.type && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select type to load categories</p>
                )}
              </div>
              <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <button
                  type="submit"
                  disabled={formLoading || user?.role === 'read-only'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Saving...' : 'Save Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 text-green-800 dark:text-green-200">
            {success}
          </div>
        )}

        {/* Transactions List */}
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No transactions found
                </li>
              ) : (
                transactions.map((transaction) => (
                  <li key={transaction.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {transaction.type === 'income' ? (
                            <ArrowUpIcon className="h-6 w-6 text-green-500" />
                          ) : (
                            <ArrowDownIcon className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.description || '(no description)'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <button
                          onClick={() => startEdit(transaction)}
                          disabled={user?.role === 'read-only'}
                          className={`p-2 rounded-md ${user?.role === 'read-only' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700'}`}
                          title={user?.role === 'read-only' ? 'Read-only users cannot edit' : 'Edit'}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          disabled={user?.role === 'read-only'}
                          className={`p-2 rounded-md ${user?.role === 'read-only' ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700'}`}
                          title={user?.role === 'read-only' ? 'Read-only users cannot delete' : 'Delete'}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {editingId === transaction.id && (
                      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {editFormError && (
                          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-red-800 dark:text-red-200">
                            {editFormError}
                          </div>
                        )}
                        <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                            <select
                              name="type"
                              value={editFormData.type}
                              onChange={handleEditChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="income">Income</option>
                              <option value="expense">Expense</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                            <input
                              type="number"
                              name="amount"
                              value={editFormData.amount}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
                            <textarea
                              name="description"
                              value={editFormData.description}
                              onChange={handleEditChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input
                              type="date"
                              name="date"
                              value={editFormData.date}
                              onChange={handleEditChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category (optional)</label>
                            <select
                              name="category_id"
                              value={editFormData.category_id ?? ''}
                              onChange={handleEditChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              disabled={!editFormData.type}
                            >
                              <option value="">Select category</option>
                              {editCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2 flex items-center gap-3 mt-2">
                            <button
                              type="submit"
                              disabled={editFormLoading || user?.role === 'read-only'}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {editFormLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
