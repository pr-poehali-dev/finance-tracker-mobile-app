const AUTH_URL = 'https://functions.poehali.dev/8b7a1651-e473-4bba-865c-e549f7445219';
const TRANSACTIONS_URL = 'https://functions.poehali.dev/d2528ab0-328e-4eac-a8bc-8457fda3cee4';

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
      if (!token) throw new Error('Not authenticated');
      
      let url = `${TRANSACTIONS_URL}?type=${type}`;
      if (year && month) {
        url += `&year=${year}&month=${month}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
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
};