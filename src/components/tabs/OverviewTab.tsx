import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Transaction } from '@/lib/api';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Продукты', color: '#0EA5E9' },
  { value: 'transport', label: 'Транспорт', color: '#F97316' },
  { value: 'entertainment', label: 'Развлечения', color: '#8B5CF6' },
  { value: 'health', label: 'Здоровье', color: '#10B981' },
  { value: 'utilities', label: 'Коммуналка', color: '#F59E0B' },
  { value: 'other', label: 'Прочее', color: '#8E9196' },
];

interface OverviewTabProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  expenses: Transaction[];
  incomes: Transaction[];
}

const OverviewTab = ({ monthlyIncome, monthlyExpenses, expenses, incomes }: OverviewTabProps) => {
  const balance = monthlyIncome - monthlyExpenses;

  return (
    <div className="space-y-6 animate-fade-in">
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
            <p className="text-3xl font-bold">{balance.toLocaleString('ru-RU')} ₽</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Последние доходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomes.slice(-5).reverse().map(income => (
                <div key={income.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{income.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(income.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{income.amount} ₽</p>
                  </div>
                </div>
              ))}
              {incomes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Пока нет доходов</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
