const AUTH_URL = 'https://functions.poehali.dev/8b7a1651-e473-4bba-865c-e549f7445219';
const TRANSACTIONS_URL = 'https://functions.poehali.dev/d2528ab0-328e-4eac-a8bc-8457fda3cee4';
const FIXED_PLANNING_URL = 'https://functions.poehali.dev/d5129445-08d9-4bd9-b376-c361d759be21';
const AUTO_EXPENSES_URL = 'https://functions.poehali.dev/6f48e8e7-ba72-4f10-b4ed-d9cf96946618';

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  date: string;
  category?: string;
}

export interface FixedExpense {
  id: number;
  title: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  isActive: boolean;
  createdAt: string;
}

export interface PlanningGoal {
  id: number;
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  category: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface AutoExpenseResult {
  created: Array<{
    id: number;
    amount: number;
    category: string;
    description: string;
    date: string;
    fixedExpenseId: number;
    fixedExpenseTitle: string;
  }>;
  skipped: Array<{
    fixedExpenseId: number;
    title: string;
    reason: string;
  }>;
  total: number;
  year: number;
  month: number;
}

export const api = {
  auth: {
    sendCode: async (email: string): Promise<{ success: boolean; message?: string; error?: string; dev_code?: string }> => {
      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'send_code', email }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to send code' };
        }
        
        return { success: true, message: data.message, dev_code: data.dev_code };
      } catch (error) {
        console.error('Send code failed:', error);
        return { success: false, error: 'Network error' };
      }
    },
    
    verifyCode: async (email: string, code: string): Promise<{ success: boolean; token?: string; user?: User; error?: string }> => {
      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'verify_code', email, code }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          return { success: false, error: data.error || 'Invalid code' };
        }
        
        return { success: true, token: data.token, user: data.user };
      } catch (error) {
        console.error('Verify code failed:', error);
        return { success: false, error: 'Network error' };
      }
    },
    
    verifyToken: async (token: string): Promise<User | null> => {
      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'verify_token', token }),
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.user;
      } catch (error) {
        console.error('Token verification failed:', error);
        return null;
      }
    },
    
    getToken: () => localStorage.getItem('auth_token'),
    
    setToken: (token: string) => localStorage.setItem('auth_token', token),
    
    logout: () => {
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
  },
  
  transactions: {
    getAll: async (type: 'income' | 'expense', year?: number, month?: number): Promise<Transaction[]> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found, redirecting to login');
        window.location.reload();
        throw new Error('Not authenticated');
      }
      
      let url = `${TRANSACTIONS_URL}?type=${type}`;
      if (year && month) {
        url += `&year=${year}&month=${month}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.reload();
        throw new Error('Unauthorized');
      }
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      return data.transactions;
    },
    
    add: async (transaction: {
      type: 'income' | 'expense';
      amount: number;
      description: string;
      category?: string;
      date?: string;
    }): Promise<Transaction> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(TRANSACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transaction),
      });
      
      if (!response.ok) throw new Error('Failed to add transaction');
      
      const data = await response.json();
      return data.transaction;
    },
    
    delete: async (id: number, type: 'income' | 'expense'): Promise<void> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${TRANSACTIONS_URL}?id=${id}&type=${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete transaction');
    },
  },
  
  fixedExpenses: {
    getAll: async (): Promise<FixedExpense[]> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${FIXED_PLANNING_URL}?type=fixed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch fixed expenses');
      
      const data = await response.json();
      return data.items;
    },
    
    add: async (item: {
      title: string;
      amount: number;
      category: string;
      dayOfMonth: number;
    }): Promise<FixedExpense> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(FIXED_PLANNING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...item, type: 'fixed' }),
      });
      
      if (!response.ok) throw new Error('Failed to add fixed expense');
      
      const data = await response.json();
      return data.item;
    },
    
    update: async (id: number, isActive: boolean): Promise<FixedExpense> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(FIXED_PLANNING_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, type: 'fixed', isActive }),
      });
      
      if (!response.ok) throw new Error('Failed to update fixed expense');
      
      const data = await response.json();
      return data.item;
    },
    
    delete: async (id: number): Promise<void> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${FIXED_PLANNING_URL}?id=${id}&type=fixed`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete fixed expense');
    },
  },
  
  planning: {
    getAll: async (): Promise<PlanningGoal[]> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${FIXED_PLANNING_URL}?type=planning`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch planning goals');
      
      const data = await response.json();
      return data.items;
    },
    
    add: async (item: {
      title: string;
      targetAmount: number;
      category: string;
      targetDate?: string;
    }): Promise<PlanningGoal> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(FIXED_PLANNING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...item, type: 'planning' }),
      });
      
      if (!response.ok) throw new Error('Failed to add planning goal');
      
      const data = await response.json();
      return data.item;
    },
    
    update: async (id: number, updates: { savedAmount?: number; isCompleted?: boolean }): Promise<PlanningGoal> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(FIXED_PLANNING_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, type: 'planning', ...updates }),
      });
      
      if (!response.ok) throw new Error('Failed to update planning goal');
      
      const data = await response.json();
      return data.item;
    },
    
    delete: async (id: number): Promise<void> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${FIXED_PLANNING_URL}?id=${id}&type=planning`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete planning goal');
    },
  },
  
  autoExpenses: {
    process: async (year?: number, month?: number): Promise<AutoExpenseResult> => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(AUTO_EXPENSES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ year, month }),
      });
      
      if (!response.ok) throw new Error('Failed to process auto expenses');
      
      const data = await response.json();
      return data;
    },
  },
};