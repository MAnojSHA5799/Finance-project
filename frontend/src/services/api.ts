import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Transaction, 
  TransactionFormData, 
  TransactionFilters, 
  TransactionListResponse,
  Category,
  AnalyticsData,
  SpendingTrend,
  CategoryStats,
  LoginFormData,
  RegisterFormData,
  ProfileFormData,
  ApiResponse,
  AuthResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Don't redirect automatically - let the AuthContext handle it
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterFormData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get<ApiResponse<User>>('/users/profile');
    return response.data;
  }

  async updateProfile(data: ProfileFormData): Promise<ApiResponse<User>> {
    const response = await this.api.put<ApiResponse<User>>('/users/profile', data);
    return response.data;
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await this.api.get<ApiResponse<User[]>>('/users');
    return response.data;
  }

  async getSystemStats(): Promise<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalCategories: number;
    systemUptime: string;
    databaseSize: string;
  }>> {
    const response = await this.api.get<ApiResponse<{
      totalUsers: number;
      activeUsers: number;
      totalTransactions: number;
      totalCategories: number;
      systemUptime: string;
      databaseSize: string;
    }>>('/admin/stats');
    return response.data;
  }

  async updateUserRole(userId: number, role: string): Promise<ApiResponse<User>> {
    const response = await this.api.put<ApiResponse<User>>(`/users/${userId}/role`, { role });
    return response.data;
  }

  async deleteUser(userId: number): Promise<ApiResponse<null>> {
    const response = await this.api.delete<ApiResponse<null>>(`/users/${userId}`);
    return response.data;
  }

  // Admin endpoints
  async adminGetUsers(): Promise<ApiResponse<User[]>> {
    const response = await this.api.get<ApiResponse<User[]>>('/admin/users');
    return response.data;
  }

  async adminGetTransactions(params: Record<string, string | number | undefined> = {}): Promise<ApiResponse<TransactionListResponse>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.append(k, String(v));
    });
    const response = await this.api.get<ApiResponse<TransactionListResponse>>(`/admin/transactions?${query}`);
    return response.data;
  }

  async adminCreateTransaction(data: Partial<TransactionFormData> & { user_id: number }): Promise<ApiResponse<Transaction>> {
    const response = await this.api.post<ApiResponse<Transaction>>('/admin/transactions', data);
    return response.data;
  }

  async adminUpdateTransaction(id: number, data: Partial<TransactionFormData>): Promise<ApiResponse<Transaction>> {
    const response = await this.api.put<ApiResponse<Transaction>>(`/admin/transactions/${id}`, data);
    return response.data;
  }

  async adminDeleteTransaction(id: number): Promise<ApiResponse<null>> {
    const response = await this.api.delete<ApiResponse<null>>(`/admin/transactions/${id}`);
    return response.data;
  }

  // Transaction endpoints
  async getTransactions(filters: TransactionFilters = {}): Promise<ApiResponse<TransactionListResponse>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await this.api.get<ApiResponse<TransactionListResponse>>(`/transactions?${params}`);
    return response.data;
  }

  async getTransaction(id: number): Promise<ApiResponse<Transaction>> {
    const response = await this.api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data;
  }

  async createTransaction(data: TransactionFormData): Promise<ApiResponse<Transaction>> {
    const response = await this.api.post<ApiResponse<Transaction>>('/transactions', data);
    return response.data;
  }

  async updateTransaction(id: number, data: Partial<TransactionFormData>): Promise<ApiResponse<Transaction>> {
    const response = await this.api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);
    return response.data;
  }

  async deleteTransaction(id: number): Promise<ApiResponse<null>> {
    const response = await this.api.delete<ApiResponse<null>>(`/transactions/${id}`);
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(period?: string, year?: number, month?: number): Promise<ApiResponse<AnalyticsData>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await this.api.get<ApiResponse<AnalyticsData>>(`/analytics/dashboard?${params}`);
    return response.data;
  }

  async getGlobalAnalytics(period?: string, year?: number, month?: number): Promise<ApiResponse<AnalyticsData>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const response = await this.api.get<ApiResponse<AnalyticsData>>(`/analytics/global?${params}`);
    return response.data;
  }

  async getCategoryAnalytics(period?: string, year?: number, month?: number): Promise<ApiResponse<CategoryStats[]>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await this.api.get<ApiResponse<CategoryStats[]>>(`/analytics/categories?${params}`);
    return response.data;
  }

  async getSpendingTrends(months: number = 6): Promise<ApiResponse<SpendingTrend[]>> {
    const response = await this.api.get<ApiResponse<SpendingTrend[]>>(`/analytics/trends?months=${months}`);
    return response.data;
  }

  // Category endpoints
  async getCategories(type?: 'income' | 'expense'): Promise<ApiResponse<Category[]>> {
    const params = type ? `?type=${type}` : '';
    const response = await this.api.get<ApiResponse<Category[]>>(`/categories${params}`);
    return response.data;
  }

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    const response = await this.api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await this.api.post<ApiResponse<Category>>('/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await this.api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number): Promise<ApiResponse<null>> {
    const response = await this.api.delete<ApiResponse<null>>(`/categories/${id}`);
    return response.data;
  }

  async getCategoryStats(period?: string, year?: number, month?: number): Promise<ApiResponse<CategoryStats[]>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await this.api.get<ApiResponse<CategoryStats[]>>(`/categories/stats/user?${params}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; message: string; timestamp: string; environment: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
