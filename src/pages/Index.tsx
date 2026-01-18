import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
};

type Income = {
  id: string;
  month: string;
  amount: number;
  source: string;
};

type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  category: string;
};

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Продукты', color: '#0EA5E9' },
  { value: 'transport', label: 'Транспорт', color: '#F97316' },
  { value: 'entertainment', label: 'Развлечения', color: '#8B5CF6' },
  { value: 'health', label: 'Здоровье', color: '#10B981' },
  { value: 'utilities', label: 'Коммуналка', color: '#F59E0B' },
  { value: 'other', label: 'Прочее', color: '#8E9196' },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', date: '2026-01-15', amount: 1200, category: 'food', description: 'Магазин' },
    { id: '2', date: '2026-01-16', amount: 500, category: 'transport', description: 'Такси' },
    { id: '3', date: '2026-01-17', amount: 2500, category: 'entertainment', description: 'Кино' },
  ]);
  const [incomes, setIncomes] = useState<Income[]>([
    { id: '1', month: '2026-01', amount: 80000, source: 'Зарплата' },
  ]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { id: '1', name: 'Аренда', amount: 25000, category: 'utilities' },
    { id: '2', name: 'Интернет', amount: 800, category: 'utilities' },
    { id: '3', name: 'Абонемент в зал', amount: 3000, category: 'health' },
  ]);

  const [newExpense, setNewExpense] = useState({ amount: '', category: 'food', description: '' });
  const [newIncome, setNewIncome] = useState({ amount: '', source: '' });
  const [newFixed, setNewFixed] = useState({ name: '', amount: '', category: 'utilities' });

  const currentMonth = '2026-01';
  const currentDate = new Date();
  const daysInMonth = new Date(2026, 0, 0).getDate();
  const daysRemaining = daysInMonth - currentDate.getDate();

  const monthlyIncome = incomes
    .filter(i => i.month === currentMonth)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalFixedExpenses = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);

  const monthlyExpenses = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const dailyAverage = monthlyExpenses / (31 - daysRemaining);
  const projectedExpenses = monthlyExpenses + (dailyAverage * daysRemaining) + totalFixedExpenses;
  const projectedBalance = monthlyIncome - projectedExpenses;

  const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.label,
    value: expenses
      .filter(e => e.category === cat.value)
      .reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  })).filter(item => item.value > 0);

  const monthlyData = [
    { name: 'Январь', income: monthlyIncome, expenses: projectedExpenses },
  ];

  const addExpense = () => {
    if (newExpense.amount && newExpense.description) {
      setExpenses([
        ...expenses,
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description,
        },
      ]);
      setNewExpense({ amount: '', category: 'food', description: '' });
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const addIncome = () => {
    if (newIncome.amount && newIncome.source) {
      setIncomes([
        ...incomes,
        {
          id: Date.now().toString(),
          month: currentMonth,
          amount: parseFloat(newIncome.amount),
          source: newIncome.source,
        },
      ]);
      setNewIncome({ amount: '', source: '' });
    }
  };

  const deleteIncome = (id: string) => {
    setIncomes(incomes.filter(i => i.id !== id));
  };

  const addFixedExpense = () => {
    if (newFixed.name && newFixed.amount) {
      setFixedExpenses([
        ...fixedExpenses,
        {
          id: Date.now().toString(),
          name: newFixed.name,
          amount: parseFloat(newFixed.amount),
          category: newFixed.category,
        },
      ]);
      setNewFixed({ name: '', amount: '', category: 'utilities' });
    }
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(fixedExpenses.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Wallet" size={28} className="text-primary" />
              <h1 className="text-2xl font-bold">Мои Финансы</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-base px-4 py-2">
                Январь 2026
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Icon name="Home" size={16} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Icon name="TrendingDown" size={16} />
              <span className="hidden sm:inline">Расходы</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <Icon name="TrendingUp" size={16} />
              <span className="hidden sm:inline">Доходы</span>
            </TabsTrigger>
            <TabsTrigger value="fixed" className="flex items-center gap-2">
              <Icon name="Calendar" size={16} />
              <span className="hidden sm:inline">Фиксированные</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Icon name="PieChart" size={16} />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <Icon name="Target" size={16} />
              <span className="hidden sm:inline">Прогноз</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Icon name="Settings" size={16} />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Доход за месяц
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {monthlyIncome.toLocaleString('ru-RU')} ₽
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Расходы (текущие)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {monthlyExpenses.toLocaleString('ru-RU')} ₽
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    + {totalFixedExpenses.toLocaleString('ru-RU')} ₽ фиксированные
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Остаток
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${monthlyIncome - monthlyExpenses - totalFixedExpenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {(monthlyIncome - monthlyExpenses - totalFixedExpenses).toLocaleString('ru-RU')} ₽
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Быстрое добавление расхода</CardTitle>
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
                <CardDescription>Общий доход за месяц: {monthlyIncome.toLocaleString('ru-RU')} ₽</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={newIncome.source}
                      onChange={e => setNewIncome({ ...newIncome, source: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addIncome} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить доход
                </Button>

                <div className="space-y-2 pt-4">
                  {incomes.map(income => (
                    <div key={income.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{income.source}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(income.month + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-green-600 text-lg">+{income.amount.toLocaleString('ru-RU')} ₽</p>
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
                <CardDescription>Итого: {totalFixedExpenses.toLocaleString('ru-RU')} ₽/месяц</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Название</Label>
                    <Input
                      placeholder="Аренда, интернет..."
                      value={newFixed.name}
                      onChange={e => setNewFixed({ ...newFixed, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Сумма</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newFixed.amount}
                      onChange={e => setNewFixed({ ...newFixed, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Категория</Label>
                    <Select
                      value={newFixed.category}
                      onValueChange={value => setNewFixed({ ...newFixed, category: value })}
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
                <Button onClick={addFixedExpense} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить фиксированный расход
                </Button>

                <div className="space-y-2 pt-4">
                  {fixedExpenses.map(fixed => {
                    const category = EXPENSE_CATEGORIES.find(c => c.value === fixed.category);
                    return (
                      <div key={fixed.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{fixed.name}</p>
                          <p className="text-sm text-muted-foreground">{category?.label}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-orange-600 text-lg">{fixed.amount.toLocaleString('ru-RU')} ₽</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFixedExpense(fixed.id)}
                          >
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {fixedExpenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">Пока нет фиксированных расходов</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Расходы по категориям</CardTitle>
                  <CardDescription>За текущий месяц</CardDescription>
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
                          label={entry => `${entry.name}: ${entry.value.toLocaleString('ru-RU')} ₽`}
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Нет данных для отображения
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Доходы vs Расходы</CardTitle>
                  <CardDescription>Сравнение за месяц</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Доходы" />
                      <Line type="monotone" dataKey="expenses" stroke="#F97316" strokeWidth={2} name="Расходы" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Прогноз на конец месяца</CardTitle>
                <CardDescription>Основан на текущих тратах и фиксированных расходах</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-muted-foreground mb-1">Средние траты в день</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dailyAverage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-muted-foreground mb-1">Прогноз расходов</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {projectedExpenses.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Текущие {monthlyExpenses.toLocaleString('ru-RU')} ₽ + прогноз {(dailyAverage * daysRemaining).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ + фикс. {totalFixedExpenses.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-muted-foreground mb-1">Доходы за месяц</p>
                      <p className="text-2xl font-bold text-green-600">
                        {monthlyIncome.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${projectedBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-sm text-muted-foreground mb-1">Прогноз остатка</p>
                      <p className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projectedBalance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {projectedBalance >= 0 ? 'Хороший запас на конец месяца' : 'Возможен дефицит средств'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Израсходовано от дохода</span>
                    <span className="text-sm font-bold">
                      {((monthlyExpenses / monthlyIncome) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(monthlyExpenses / monthlyIncome) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Осталось дней в месяце: {daysRemaining}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Настройки</CardTitle>
                <CardDescription>Управление приложением</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="font-medium mb-2">О приложении</p>
                  <p className="text-sm text-muted-foreground">
                    Финансовое приложение для учёта личных расходов и доходов. Версия 1.0
                  </p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="font-medium mb-2">Валюта</p>
                  <p className="text-sm text-muted-foreground">Российский рубль (₽)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
