import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { User } from '../types';
import { 
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalCategories: number;
  systemUptime: string;
  databaseSize: string;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // User management states
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<string>('');
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiService.getAllUsers();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiService.getSystemStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load system stats');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUsers(), fetchStats()]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchUsers, fetchStats]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditingRole(user.role);
    setError(null);
    setSuccess(null);
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditingRole('');
    setError(null);
  };

  const updateUserRole = async () => {
    if (!editingUserId || !editingRole) return;
    
    try {
      setUserActionLoading(true);
      setError(null);
      await apiService.updateUserRole(editingUserId, editingRole);
      setSuccess('User role updated successfully');
      setEditingUserId(null);
      setEditingRole('');
      await fetchUsers(); // Refresh user list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUserActionLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete user "${userToDelete.username}"? This action cannot be undone and will also delete all their transactions.`
    );
    
    if (!confirmDelete) return;
    
    try {
      setUserActionLoading(true);
      setError(null);
      await apiService.deleteUser(userId);
      setSuccess('User deleted successfully');
      setDeletingUserId(null);
      await fetchUsers(); // Refresh user list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setUserActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'read-only':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
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
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            System administration and user management
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <CogIcon className="h-5 w-5 inline mr-2" />
              System
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.activeUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalTransactions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Uptime</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.systemUptime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Health
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Database Size
                    </h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.databaseSize}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Categories
                    </h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.totalCategories}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Management
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((userItem) => (
                    <tr key={userItem.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {userItem.first_name?.[0]}{userItem.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {userItem.first_name} {userItem.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === userItem.id ? (
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          >
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="read-only">Read-Only</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                            {userItem.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(userItem.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {userItem.last_login ? formatDate(userItem.last_login) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingUserId === userItem.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={updateUserRole}
                              disabled={userActionLoading}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditUser}
                              disabled={userActionLoading}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 disabled:opacity-50"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditUser(userItem)}
                              disabled={userActionLoading || userItem.id === user?.id}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 disabled:opacity-50"
                              title={userItem.id === user?.id ? "Cannot edit your own role" : "Edit role"}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteUser(userItem.id)}
                              disabled={userActionLoading || userItem.id === user?.id}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                              title={userItem.id === user?.id ? "Cannot delete your own account" : "Delete user"}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                System Configuration
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Maintenance Mode
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enable maintenance mode for system updates
                    </p>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Configure
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Backup Database
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create a backup of the current database
                    </p>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Backup
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      System Logs
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View system logs and error reports
                    </p>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    View Logs
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    System Notice
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    This is an administrative interface. Please be careful with system changes as they may affect all users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
