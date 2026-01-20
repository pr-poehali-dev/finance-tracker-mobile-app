import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Transaction } from '@/lib/api';

interface IncomeTabProps {
  incomes: Transaction[];
  monthlyIncome: number;
  newIncome: { amount: string; description: string };
  setNewIncome: (income: { amount: string; description: string }) => void;
  addIncome: () => void;
  deleteIncome: (id: number) => void;
}

const IncomeTab = ({
  incomes,
  monthlyIncome,
  newIncome,
  setNewIncome,
  addIncome,
  deleteIncome,
}: IncomeTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
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
    </div>
  );
};

export default IncomeTab;
