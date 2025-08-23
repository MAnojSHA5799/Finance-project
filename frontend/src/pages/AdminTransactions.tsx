import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import apiService from '../services/api';
import { TransactionListResponse, User, Category } from '../types';
import { PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const AdminTransactions: React.FC = () => {
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState<{ user_id: number | ''; type: 'income' | 'expense' | ''; amount: string; description: string; date: string; category_id?: number | '' }>({
    user_id: '',
    type: '',
    amount: '',
    description: '',
    date: '',
    category_id: ''
  });

  // Edit form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<{ type: 'income' | 'expense' | ''; amount: string; description: string; date: string; category_id?: number | '' }>({
    type: '',
    amount: '',
    description: '',
    date: '',
    category_id: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.adminGetTransactions({ page, limit, search: search || undefined, type: type || undefined });
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await apiService.adminGetUsers();
        setUsers(res.data);
      } catch {}
    };
    loadUsers();
  }, []);

  const loadCategories = useCallback(async (t: 'income' | 'expense' | '') => {
    try {
      if (!t) { setCategories([]); return; }
      const res = await apiService.getCategories(t);
      setCategories(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadCategories(addForm.type); }, [addForm.type, loadCategories]);
  useEffect(() => { loadCategories(editForm.type); }, [editForm.type, loadCategories]);

  const onDelete = async (id: number) => {
    const ok = window.confirm('Delete this transaction?');
    if (!ok) return;
    try {
      await apiService.adminDeleteTransaction(id);
      setSuccess('Transaction deleted');
      await fetchData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setEditForm({
      type: t.type,
      amount: String(t.amount),
      description: t.description || '',
      date: new Date(t.date).toISOString().slice(0,10),
      category_id: t.category_id || ''
    });
    setSuccess(null);
    setError(null);
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setEditLoading(true);
      const amountNum = Number(editForm.amount);
      await apiService.adminUpdateTransaction(editingId, {
        type: editForm.type || undefined,
        amount: Number.isNaN(amountNum) ? undefined : amountNum,
        description: editForm.description || undefined,
        date: editForm.date || undefined,
        category_id: typeof editForm.category_id === 'number' ? editForm.category_id : undefined
      });
      setSuccess('Transaction updated');
      setEditingId(null);
      await fetchData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update transaction');
    } finally {
      setEditLoading(false);
    }
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      const amountNum = Number(addForm.amount);
      await apiService.adminCreateTransaction({
        user_id: Number(addForm.user_id),
        type: addForm.type as 'income' | 'expense',
        amount: amountNum,
        description: addForm.description || undefined,
        date: addForm.date,
        category_id: typeof addForm.category_id === 'number' ? addForm.category_id : undefined
      });
      setSuccess('Transaction added');
      setShowAdd(false);
      setAddForm({ user_id: '', type: '', amount: '', description: '', date: '', category_id: '' });
      await fetchData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add transaction');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Transactions</h1>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-red-800 dark:text-red-200">{error}</div>}
        {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-green-800 dark:text-green-200">{success}</div>}

        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, category, user..." className="input w-full max-w-sm" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="input w-40">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button onClick={() => { setPage(1); fetchData(); }} className="btn btn-primary">Filter</button>
          <button onClick={() => setShowAdd(s => !s)} className="btn inline-flex items-center"><PlusIcon className="h-4 w-4 mr-1" /> {showAdd ? 'Close' : 'Add Transaction'}</button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <form onSubmit={submitAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">User</label>
                <select className="input w-full" value={addForm.user_id} onChange={(e) => setAddForm(f => ({...f, user_id: e.target.value ? Number(e.target.value) : ''}))} required>
                  <option value="">Select user</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select className="input w-full" value={addForm.type} onChange={(e) => setAddForm(f => ({...f, type: e.target.value as any}))} required>
                  <option value="">Select</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Amount</label>
                <input type="number" step="0.01" className="input w-full" value={addForm.amount} onChange={(e) => setAddForm(f => ({...f, amount: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input type="date" className="input w-full" value={addForm.date} onChange={(e) => setAddForm(f => ({...f, date: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Category</label>
                <select className="input w-full" value={addForm.category_id ?? ''} onChange={(e) => setAddForm(f => ({...f, category_id: e.target.value ? Number(e.target.value) : ''}))} disabled={!addForm.type}>
                  <option value="">Select</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm mb-1">Description</label>
                <input className="input w-full" value={addForm.description} onChange={(e) => setAddForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn">Cancel</button>
                <button type="submit" disabled={addLoading} className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.transactions.map((t: any) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{t.username || t.email || t.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    {editingId === t.id ? (
                      <select className="input w-32" value={editForm.type} onChange={(e) => setEditForm(f => ({...f, type: e.target.value as any}))}>
                        <option value="income">income</option>
                        <option value="expense">expense</option>
                      </select>
                    ) : t.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === t.id ? (
                      <input type="number" step="0.01" className="input w-28" value={editForm.amount} onChange={(e) => setEditForm(f => ({...f, amount: e.target.value}))} />
                    ) : t.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === t.id ? (
                      <select className="input w-40" value={editForm.category_id ?? ''} onChange={(e) => setEditForm(f => ({...f, category_id: e.target.value ? Number(e.target.value) : ''}))}>
                        <option value="">Uncategorized</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (t.category_name || 'Uncategorized')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === t.id ? (
                      <input type="date" className="input w-40" value={editForm.date} onChange={(e) => setEditForm(f => ({...f, date: e.target.value}))} />
                    ) : new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === t.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={saveEdit} disabled={editLoading} className="text-green-600 dark:text-green-400" title="Save"><CheckIcon className="h-4 w-4" /></button>
                        <button onClick={cancelEdit} className="text-gray-600 dark:text-gray-400" title="Cancel"><XMarkIcon className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(t)} className="text-blue-600 dark:text-blue-400" title="Edit"><PencilSquareIcon className="h-4 w-4" /></button>
                        <button onClick={() => onDelete(t.id)} className="text-red-600 dark:text-red-400" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between">
            <button disabled={!data.pagination.has_prev} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn">Previous</button>
            <div className="text-sm text-gray-500 dark:text-gray-300">Page {data.pagination.current_page} of {data.pagination.total_pages}</div>
            <button disabled={!data.pagination.has_next} onClick={() => setPage(p => p + 1)} className="btn">Next</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminTransactions;


