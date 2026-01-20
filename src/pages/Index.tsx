import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import LoginPage from '@/components/LoginPage';
import { api, User, Transaction } from '@/lib/api';

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

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="TrendingUp" size={24} />
                    Доходы за месяц
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{monthlyIncome.toLocaleString('ru-RU')} ₽</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="TrendingDown" size={24} />
                    Расходы за месяц
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{monthlyExpenses.toLocaleString('ru-RU')} ₽</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Wallet" size={24} />
                    Остаток
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{(monthlyIncome - monthlyExpenses).toLocaleString('ru-RU')} ₽</p>
                </CardContent>
              </Card>
            </div>

            {expensesByCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Расходы по категориям</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toLocaleString('ru-RU')} ₽`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Добавить расход</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Сумма</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newExpense.amount}
                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Категория</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={value => setNewExpense({ ...newExpense, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Input
                      placeholder="На что потратили?"
                      value={newExpense.description}
                      onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={addExpense} className="w-full">
                    <Icon name="Plus" size={16} className="mr-2" />
                    Добавить расход
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Последние расходы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expenses.slice(-5).reverse().map(expense => {
                      const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {category?.label} • {new Date(expense.date).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">-{expense.amount} ₽</p>
                          </div>
                        </div>
                      );
                    })}
                    {expenses.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Пока нет расходов</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Все расходы</CardTitle>
                <CardDescription>Текущий месяц: {monthlyExpenses.toLocaleString('ru-RU')} ₽</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenses.map(expense => {
                    const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {category?.label} • {new Date(expense.date).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-orange-600 text-lg">-{expense.amount} ₽</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {expenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">Пока нет расходов</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Доходы</CardTitle>
                <CardDescription>Общий доход: {monthlyIncome.toLocaleString('ru-RU')} ₽</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Сумма</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newIncome.amount}
                      onChange={e => setNewIncome({ ...newIncome, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Источник</Label>
                    <Input
                      placeholder="Откуда доход?"
                      value={newIncome.description}
                      onChange={e => setNewIncome({ ...newIncome, description: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addIncome} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить доход
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Все доходы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomes.map(income => (
                    <div key={income.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{income.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(income.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-green-600 text-lg">+{income.amount} ₽</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteIncome(income.id)}
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {incomes.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">Пока нет доходов</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixed" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Фиксированные расходы</CardTitle>
                <CardDescription>Регулярные ежемесячные платежи</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Раздел в разработке</p>
                    <p className="text-sm mt-2">Здесь будут отображаться регулярные платежи</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Прогноз расходов</CardTitle>
                <CardDescription>Анализ и предсказание будущих трат</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Средний расход в день</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dailyAverage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Прогноз на месяц</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {projectedExpenses.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Ожидаемый остаток</p>
                      <p className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projectedBalance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </p>
                    </div>
                  </div>

                  {isCurrentMonth && (
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Прогноз до конца месяца</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Осталось дней: {daysRemaining}
                        </p>
                        <Progress value={(currentDate.getDate() / daysInMonth) * 100} className="h-2 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          При текущем темпе расходов ({dailyAverage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/день) 
                          к концу месяца вы потратите около {projectedExpenses.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Распределение расходов по категориям</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {expensesByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={expensesByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {expensesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Нет данных для отображения</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Настройки</CardTitle>
                <CardDescription>Персонализация трекера</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Профиль</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Имя</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Месячный бюджет</h3>
                  <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <Icon name="Target" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Раздел в разработке</p>
                    <p className="text-sm mt-2">Скоро вы сможете установить лимит расходов</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Уведомления</h3>
                  <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Раздел в разработке</p>
                    <p className="text-sm mt-2">Настройка напоминаний и уведомлений</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;