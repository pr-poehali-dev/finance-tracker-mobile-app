import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import LoginPage from '@/components/LoginPage';
import { api, User, Transaction } from '@/lib/api';
import OverviewTab from '@/components/tabs/OverviewTab';
import ExpensesTab from '@/components/tabs/ExpensesTab';
import IncomeTab from '@/components/tabs/IncomeTab';
import { FixedTab, ForecastTab, SettingsTab } from '@/components/tabs/OtherTabs';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Продукты', color: '#0EA5E9' },
  { value: 'transport', label: 'Транспорт', color: '#F97316' },
  { value: 'entertainment', label: 'Развлечения', color: '#8B5CF6' },
  { value: 'health', label: 'Здоровье', color: '#10B981' },
  { value: 'utilities', label: 'Коммуналка', color: '#F59E0B' },
  { value: 'other', label: 'Прочее', color: '#8E9196' },
];

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'food', description: '' });
  const [newIncome, setNewIncome] = useState({ amount: '', description: '' });

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = api.auth.getToken();
      if (savedToken) {
        const userData = await api.auth.verifyToken(savedToken);
        if (userData) {
          setUser(userData);
        } else {
          api.auth.logout();
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, selectedDate]);

  const loadTransactions = async () => {
    try {
      const [expensesData, incomesData] = await Promise.all([
        api.transactions.getAll('expense', selectedDate.year, selectedDate.month),
        api.transactions.getAll('income', selectedDate.year, selectedDate.month),
      ]);
      setExpenses(expensesData);
      setIncomes(incomesData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const addExpense = async () => {
    if (!newExpense.amount) return;
    
    try {
      await api.transactions.add({
        type: 'expense',
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: new Date().toISOString().split('T')[0],
      });
      
      setNewExpense({ amount: '', category: 'food', description: '' });
      await loadTransactions();
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const addIncome = async () => {
    if (!newIncome.amount) return;
    
    try {
      await api.transactions.add({
        type: 'income',
        amount: parseFloat(newIncome.amount),
        description: newIncome.description,
        date: new Date().toISOString().split('T')[0],
      });
      
      setNewIncome({ amount: '', description: '' });
      await loadTransactions();
    } catch (error) {
      console.error('Failed to add income:', error);
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await api.transactions.delete(id, 'expense');
      await loadTransactions();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const deleteIncome = async (id: number) => {
    try {
      await api.transactions.delete(id, 'income');
      await loadTransactions();
    } catch (error) {
      console.error('Failed to delete income:', error);
    }
  };

  const changeMonth = (offset: number) => {
    setSelectedDate(prev => {
      let newMonth = prev.month + offset;
      let newYear = prev.year;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      
      return { year: newYear, month: newMonth };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const currentDate = new Date();
  const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
  const isCurrentMonth = selectedDate.year === currentDate.getFullYear() && selectedDate.month === currentDate.getMonth() + 1;
  const daysRemaining = isCurrentMonth ? daysInMonth - currentDate.getDate() : 0;

  const monthlyIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const monthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyAverage = isCurrentMonth && currentDate.getDate() > 0 ? monthlyExpenses / currentDate.getDate() : 0;
  const projectedExpenses = monthlyExpenses + (dailyAverage * daysRemaining);
  const projectedBalance = monthlyIncome - projectedExpenses;

  const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.label,
    value: expenses
      .filter(e => e.category === cat.value)
      .reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  })).filter(cat => cat.value > 0);

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const currentMonthName = monthNames[selectedDate.month - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Финансовый трекер
            </h1>
            <p className="text-muted-foreground mt-1">Привет, {user.name}! 👋</p>
          </div>
          <Button variant="outline" onClick={() => api.auth.logout()}>
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
            <Icon name="ChevronLeft" size={20} />
          </Button>
          <h2 className="text-2xl font-semibold min-w-[200px] text-center">
            {currentMonthName} {selectedDate.year}
          </h2>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
            <Icon name="ChevronRight" size={20} />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-12">
            <TabsTrigger value="overview" className="text-base">
              <Icon name="LayoutDashboard" size={18} className="mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-base">
              <Icon name="TrendingDown" size={18} className="mr-2" />
              Расходы
            </TabsTrigger>
            <TabsTrigger value="income" className="text-base">
              <Icon name="TrendingUp" size={18} className="mr-2" />
              Доходы
            </TabsTrigger>
            <TabsTrigger value="fixed" className="text-base">
              <Icon name="Calendar" size={18} className="mr-2" />
              Фиксированные
            </TabsTrigger>
            <TabsTrigger value="forecast" className="text-base">
              <Icon name="LineChart" size={18} className="mr-2" />
              Прогноз
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-base">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyExpenses}
              expenses={expenses}
              incomes={incomes}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab
              expenses={expenses}
              monthlyExpenses={monthlyExpenses}
              newExpense={newExpense}
              setNewExpense={setNewExpense}
              addExpense={addExpense}
              deleteExpense={deleteExpense}
            />
          </TabsContent>

          <TabsContent value="income">
            <IncomeTab
              incomes={incomes}
              monthlyIncome={monthlyIncome}
              newIncome={newIncome}
              setNewIncome={setNewIncome}
              addIncome={addIncome}
              deleteIncome={deleteIncome}
            />
          </TabsContent>

          <TabsContent value="fixed">
            <FixedTab />
          </TabsContent>

          <TabsContent value="forecast">
            <ForecastTab
              user={user}
              expenses={expenses}
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyExpenses}
              isCurrentMonth={isCurrentMonth}
              currentDate={currentDate}
              daysInMonth={daysInMonth}
              daysRemaining={daysRemaining}
              dailyAverage={dailyAverage}
              projectedExpenses={projectedExpenses}
              projectedBalance={projectedBalance}
              expensesByCategory={expensesByCategory}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
