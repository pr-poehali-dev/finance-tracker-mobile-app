const AUTH_URL = 'https://functions.poehali.dev/8b7a1651-e473-4bba-865c-e549f7445219';
const TRANSACTIONS_URL = 'https://functions.poehali.dev/d2528ab0-328e-4eac-a8bc-8457fda3cee4';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
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
    login: () => {
      window.location.href = `${AUTH_URL}?login=true`;
    },
    
    verifyToken: async (token: string): Promise<User | null> => {
      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
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
