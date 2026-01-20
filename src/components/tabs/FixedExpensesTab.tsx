import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api, FixedExpense } from '@/lib/api';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Продукты' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'utilities', label: 'Коммуналка' },
  { value: 'subscription', label: 'Подписки' },
  { value: 'rent', label: 'Аренда' },
  { value: 'other', label: 'Прочее' },
];

const FixedExpensesTab = () => {
  const [items, setItems] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    title: '',
    amount: '',
    category: 'utilities',
    dayOfMonth: '1',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await api.fixedExpenses.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load fixed expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.title || !newItem.amount) return;

    try {
      await api.fixedExpenses.add({
        title: newItem.title,
        amount: parseFloat(newItem.amount),
        category: newItem.category,
        dayOfMonth: parseInt(newItem.dayOfMonth),
      });

      setNewItem({ title: '', amount: '', category: 'utilities', dayOfMonth: '1' });
      await loadItems();
    } catch (error) {
      console.error('Failed to add fixed expense:', error);
    }
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      await api.fixedExpenses.update(id, !isActive);
      await loadItems();
    } catch (error) {
      console.error('Failed to update fixed expense:', error);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      await api.fixedExpenses.delete(id);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete fixed expense:', error);
    }
  };

  const totalMonthly = items
    .filter(item => item.isActive)
    .reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle>Фиксированные расходы</CardTitle>
          <CardDescription>
            Регулярные платежи каждый месяц: {totalMonthly.toLocaleString('ru-RU')} ₽
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Название</Label>
              <Input
                placeholder="Квартплата"
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Сумма</Label>
              <Input
                type="number"
                placeholder="0"
                value={newItem.amount}
                onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Категория</Label>
              <Select
                value={newItem.category}
                onValueChange={value => setNewItem({ ...newItem, category: value })}
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
            <div>
              <Label>День месяца</Label>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="1"
                value={newItem.dayOfMonth}
                onChange={e => setNewItem({ ...newItem, dayOfMonth: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={addItem} className="w-full">
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить фиксированный расход
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список регулярных платежей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map(item => {
              const category = EXPENSE_CATEGORIES.find(c => c.value === item.category);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    item.isActive
                      ? 'bg-secondary/50 hover:bg-secondary'
                      : 'bg-secondary/20 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {!item.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Неактивен
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {category?.label} • Списание {item.dayOfMonth} числа
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-purple-600 text-lg">
                      {item.amount.toLocaleString('ru-RU')} ₽
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(item.id, item.isActive)}
                      title={item.isActive ? 'Отключить' : 'Включить'}
                    >
                      <Icon
                        name={item.isActive ? 'ToggleRight' : 'ToggleLeft'}
                        size={20}
                        className={item.isActive ? 'text-green-600' : 'text-gray-400'}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Icon name="Trash2" size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет фиксированных расходов</p>
                <p className="text-sm mt-2">Добавьте регулярные платежи, чтобы не забывать о них</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedExpensesTab;
