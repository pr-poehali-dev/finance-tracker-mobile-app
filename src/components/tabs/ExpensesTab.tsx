import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface ExpensesTabProps {
  expenses: Transaction[];
  monthlyExpenses: number;
  newExpense: { amount: string; category: string; description: string };
  setNewExpense: (expense: { amount: string; category: string; description: string }) => void;
  addExpense: () => void;
  deleteExpense: (id: number) => void;
}

const ExpensesTab = ({
  expenses,
  monthlyExpenses,
  newExpense,
  setNewExpense,
  addExpense,
  deleteExpense,
}: ExpensesTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 lg:grid-cols-2">
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
    </div>
  );
};

export default ExpensesTab;
