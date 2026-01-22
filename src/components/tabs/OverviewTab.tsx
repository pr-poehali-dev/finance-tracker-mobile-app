import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Transaction } from '@/lib/api';

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

interface OverviewTabProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  regularExpenses: number;
  fixedExpenses: number;
  expenses: Transaction[];
  incomes: Transaction[];
}

const OverviewTab = ({ monthlyIncome, monthlyExpenses, regularExpenses, fixedExpenses, expenses, incomes }: OverviewTabProps) => {
  const balance = monthlyIncome - monthlyExpenses;
  const incomePercentage = monthlyIncome > 0 ? (monthlyIncome / (monthlyIncome + monthlyExpenses)) * 100 : 50;
  const expensePercentage = 100 - incomePercentage;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Icon name="BarChart3" size={20} />
            Баланс за месяц
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 h-16 rounded-lg overflow-hidden">
            <div 
              className="bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center transition-all duration-500"
              style={{ width: `${incomePercentage}%` }}
            >
              {incomePercentage > 20 && (
                <span className="text-white font-bold text-sm sm:text-base">
                  {monthlyIncome.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
            <div 
              className="bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center transition-all duration-500"
              style={{ width: `${expensePercentage}%` }}
            >
              {expensePercentage > 20 && (
                <span className="text-white font-bold text-sm sm:text-base">
                  {monthlyExpenses.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Доходы</span>
              <span className="font-semibold">{incomePercentage.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-muted-foreground">Расходы</span>
              <span className="font-semibold">{expensePercentage.toFixed(0)}%</span>
            </div>
          </div>

          <div className={`text-center py-3 px-4 rounded-lg ${balance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className="text-sm text-muted-foreground mb-1">Результат месяца</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString('ru-RU')} ₽
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0 ? 'Вы в плюсе! 🎉' : 'Расходы превышают доходы'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Icon name="TrendingUp" size={20} />
              Доходы за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold">{monthlyIncome.toLocaleString('ru-RU')} ₽</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Icon name="TrendingDown" size={20} />
              Расходы за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold">{monthlyExpenses.toLocaleString('ru-RU')} ₽</p>
            {fixedExpenses > 0 && (
              <div className="mt-2 pt-2 border-t border-orange-400/30">
                <p className="text-xs sm:text-sm opacity-90">Обычные: {regularExpenses.toLocaleString('ru-RU')} ₽</p>
                <p className="text-xs sm:text-sm opacity-90">Фиксированные: {fixedExpenses.toLocaleString('ru-RU')} ₽</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Icon name="Wallet" size={20} />
              Остаток
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold">{balance.toLocaleString('ru-RU')} ₽</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Последние расходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.slice(-5).reverse().map(expense => {
                const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-2 sm:p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{expense.description}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {category?.label} • {new Date(expense.date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-orange-600 text-sm sm:text-base whitespace-nowrap">-{expense.amount} ₽</p>
                    </div>
                  </div>
                );
              })}
              {expenses.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">Пока нет расходов</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Последние доходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomes.slice(-5).reverse().map(income => (
                <div key={income.id} className="flex items-center justify-between p-2 sm:p-3 bg-secondary/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{income.description}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(income.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-bold text-green-600 text-sm sm:text-base whitespace-nowrap">+{income.amount} ₽</p>
                  </div>
                </div>
              ))}
              {incomes.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">Пока нет доходов</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;