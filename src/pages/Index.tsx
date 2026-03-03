import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import LoginPage from '@/components/LoginPage';
import { api, User, Transaction, FixedExpense } from '@/lib/api';
import OverviewTab from '@/components/tabs/OverviewTab';
import ExpensesTab from '@/components/tabs/ExpensesTab';
import IncomeTab from '@/components/tabs/IncomeTab';
import { ForecastTab, SettingsTab } from '@/components/tabs/OtherTabs';
import FixedExpensesTab from '@/components/tabs/FixedExpensesTab';
import PlanningTab from '@/components/tabs/PlanningTab';
import CreditsTab from '@/components/tabs/CreditsTab';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Продукты', color: '#0EA5E9' },
  { value: 'transport', label: 'Транспорт', color: '#F97316' },
  { value: 'entertainment', label: 'Развлечения', color: '#8B5CF6' },
  { value: 'health', label: 'Здоровье', color: '#10B981' },
  { value: 'utilities', label: 'Коммуналка', color: '#F59E0B' },
  { value: 'children', label: 'Дети', color: '#EC4899' },
  { value: 'taxes', label: 'Налоги и штрафы', color: '#EF4444' },
  { value: 'marketplace', label: 'Маркетплейсы', color: '#06B6D4' },
  { value: 'services', label: 'Услуги', color: '#14B8A6' },
  { value: 'restaurants', label: 'Кафе и рестораны', color: '#F59E0B' },
  { value: 'other', label: 'Прочее', color: '#8E9196' },
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Обзор', icon: 'LayoutDashboard' },
  { id: 'expenses', label: 'Расходы', icon: 'TrendingDown' },
  { id: 'income', label: 'Доходы', icon: 'TrendingUp' },
  { id: 'fixed', label: 'Фикс. расходы', icon: 'Calendar' },
  { id: 'credits', label: 'Кредиты', icon: 'CreditCard' },
  { id: 'forecast', label: 'Прогноз', icon: 'LineChart' },
  { id: 'planning', label: 'Планирование', icon: 'Target' },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);

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
      loadFixedExpenses();
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

  const loadFixedExpenses = async () => {
    try {
      const data = await api.fixedExpenses.getAll();
      setFixedExpenses(data);
    } catch (error) {
      console.error('Failed to load fixed expenses:', error);
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
      if (newMonth > 12) { newMonth = 1; newYear++; }
      else if (newMonth < 1) { newMonth = 12; newYear--; }
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
  const regularExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFixedExpenses = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  const monthlyExpenses = regularExpenses + totalFixedExpenses;
  const dailyAverageRegular = isCurrentMonth && currentDate.getDate() > 0 ? regularExpenses / currentDate.getDate() : 0;
  const projectedRegularExpenses = regularExpenses + (dailyAverageRegular * daysRemaining);
  const projectedExpenses = projectedRegularExpenses + totalFixedExpenses;
  const projectedBalance = monthlyIncome - projectedExpenses;
  const dailyAverage = isCurrentMonth && currentDate.getDate() > 0 ? regularExpenses / currentDate.getDate() : 0;

  const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.label,
    value: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  })).filter(cat => cat.value > 0);

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const currentMonthName = monthNames[selectedDate.month - 1];
  const activeNavItem = NAV_ITEMS.find(n => n.id === activeTab);

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex">
      {/* Overlay на мобилке */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Сайдбар */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            GoGoMoney
          </h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">Привет, {user.name}!</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                ${activeTab === item.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}
              `}
            >
              <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => api.auth.logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Icon name="LogOut" size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Топбар */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="Menu" size={22} />
          </button>

          <div className="flex items-center gap-1 font-semibold text-base text-gray-800">
            {activeNavItem && <Icon name={activeNavItem.icon as Parameters<typeof Icon>[0]['name']} size={18} className="text-orange-500" />}
            <span className="ml-1">{activeNavItem?.label}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-sm font-medium min-w-[130px] text-center">
              {currentMonthName} {selectedDate.year}
            </span>
            <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </header>

        {/* Контент вкладки */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyExpenses}
              regularExpenses={regularExpenses}
              fixedExpenses={totalFixedExpenses}
              expenses={expenses}
              incomes={incomes}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              monthlyExpenses={monthlyExpenses}
              newExpense={newExpense}
              setNewExpense={setNewExpense}
              addExpense={addExpense}
              deleteExpense={deleteExpense}
            />
          )}
          {activeTab === 'income' && (
            <IncomeTab
              incomes={incomes}
              monthlyIncome={monthlyIncome}
              newIncome={newIncome}
              setNewIncome={setNewIncome}
              addIncome={addIncome}
              deleteIncome={deleteIncome}
            />
          )}
          {activeTab === 'fixed' && (
            <FixedExpensesTab onUpdate={loadFixedExpenses} />
          )}
          {activeTab === 'credits' && (
            <CreditsTab onUpdate={() => {}} />
          )}
          {activeTab === 'forecast' && (
            <ForecastTab
              user={user}
              expenses={expenses}
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyExpenses}
              regularExpenses={regularExpenses}
              fixedExpenses={totalFixedExpenses}
              isCurrentMonth={isCurrentMonth}
              currentDate={currentDate}
              daysInMonth={daysInMonth}
              daysRemaining={daysRemaining}
              dailyAverage={dailyAverage}
              projectedExpenses={projectedExpenses}
              projectedBalance={projectedBalance}
              expensesByCategory={expensesByCategory}
            />
          )}
          {activeTab === 'planning' && (
            <PlanningTab expenses={expenses} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab user={user} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
