// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'user' | 'read-only';
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Transaction types
export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  created_at: string;
}

export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
  category_id?: number;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  category_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort_by?: 'date' | 'amount' | 'created_at' | 'description';
  sort_order?: 'asc' | 'desc';
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Category types
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
}

export interface CategoryStats {
  id: number;
  name: string;
  color: string;
  type: 'income' | 'expense';
  total: number;
  count: number;
  average: number;
  minAmount: number;
  maxAmount: number;
}

// Analytics types
export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CategoryBreakdown {
  category: string;
  color: string;
  type: 'income' | 'expense';
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: number;
  monthName: string;
  income: number;
  expenses: number;
  net: number;
}

export interface RecentTransaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  color: string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  recentTransactions: RecentTransaction[];
}

export interface SpendingTrend {
  month: string;
  monthName: string;
  income: number;
  expenses: number;
  net: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  fromCache?: boolean;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'user' | 'read-only';
}

export interface ProfileFormData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  name: string;
  income: number;
  expenses: number;
  net: number;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: string[];
}
