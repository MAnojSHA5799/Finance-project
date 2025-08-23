import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import apiService from '../services/api';
import { User } from '../types';
import { PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.adminGetUsers();
      setUsers(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditingRole(user.role);
    setSuccess(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditingRole('');
  };

  const saveRole = async () => {
    if (!editingUserId) return;
    try {
      setActionLoading(true);
      await apiService.updateUserRole(editingUserId, editingRole);
      setSuccess('Role updated');
      setEditingUserId(null);
      await loadUsers();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    const ok = window.confirm('Delete this user? All their transactions will be removed.');
    if (!ok) return;
    try {
      setActionLoading(true);
      await apiService.deleteUser(id);
      setSuccess('User deleted');
      await loadUsers();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Users</h1>
        </div>
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-red-800 dark:text-red-200">{error}</div>}
        {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-green-800 dark:text-green-200">{success}</div>}

        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{u.first_name} {u.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === u.id ? (
                      <select value={editingRole} onChange={(e) => setEditingRole(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                        <option value="read-only">read-only</option>
                      </select>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 capitalize">{u.role}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingUserId === u.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={saveRole} disabled={actionLoading} className="text-green-600 dark:text-green-400"><CheckIcon className="h-4 w-4" /></button>
                        <button onClick={cancelEdit} disabled={actionLoading} className="text-gray-600 dark:text-gray-400"><XMarkIcon className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(u)} disabled={actionLoading} className="text-blue-600 dark:text-blue-400"><PencilSquareIcon className="h-4 w-4" /></button>
                        <button onClick={() => deleteUser(u.id)} disabled={actionLoading} className="text-red-600 dark:text-red-400"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsers;


