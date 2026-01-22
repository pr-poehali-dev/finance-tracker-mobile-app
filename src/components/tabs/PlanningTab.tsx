import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { api, PlanningGoal, PlanningDeposit, Transaction } from '@/lib/api';

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

interface PlanningTabProps {
  expenses: Transaction[];
}

const PlanningTab = ({ expenses }: PlanningTabProps) => {
  const [items, setItems] = useState<PlanningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    title: '',
    targetAmount: '',
    category: 'food',
    targetDate: '',
  });
  const [editingAmount, setEditingAmount] = useState<{ [key: number]: { amount: string; comment: string } }>({});
  const [editingDeposit, setEditingDeposit] = useState<{ id: number; amount: string; comment: string } | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [deposits, setDeposits] = useState<{ [key: number]: PlanningDeposit[] }>({});

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await api.planning.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load planning goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeposits = async (planningId: number) => {
    try {
      const data = await api.planning.getDeposits(planningId);
      setDeposits(prev => ({ ...prev, [planningId]: data }));
    } catch (error) {
      console.error('Failed to load deposits:', error);
    }
  };

  const updateDeposit = async (planningId: number, depositId: number) => {
    if (!editingDeposit) return;

    try {
      await api.planning.updateDeposit(
        planningId,
        depositId,
        parseFloat(editingDeposit.amount),
        editingDeposit.comment
      );
      setEditingDeposit(null);
      await loadItems();
      await loadDeposits(planningId);
    } catch (error) {
      console.error('Failed to update deposit:', error);
    }
  };

  const deleteDeposit = async (planningId: number, depositId: number) => {
    try {
      await api.planning.deleteDeposit(planningId, depositId);
      await loadItems();
      await loadDeposits(planningId);
    } catch (error) {
      console.error('Failed to delete deposit:', error);
    }
  };

  const addItem = async () => {
    if (!newItem.title || !newItem.targetAmount) return;

    try {
      await api.planning.add({
        title: newItem.title,
        targetAmount: parseFloat(newItem.targetAmount),
        category: newItem.category,
        targetDate: newItem.targetDate || undefined,
      });

      setNewItem({ title: '', targetAmount: '', category: 'food', targetDate: '' });
      await loadItems();
    } catch (error) {
      console.error('Failed to add planning goal:', error);
    }
  };

  const addExpense = async (id: number) => {
    const value = editingAmount[id];
    if (!value || !value.amount) return;

    try {
      await api.planning.update(id, { 
        addAmount: parseFloat(value.amount),
        comment: value.comment || ''
      });
      setEditingAmount({ ...editingAmount, [id]: { amount: '', comment: '' } });
      await loadItems();
      if (expandedGoal === id) {
        await loadDeposits(id);
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const toggleCompleted = async (id: number, isCompleted: boolean) => {
    try {
      await api.planning.update(id, { isCompleted: !isCompleted });
      await loadItems();
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      await api.planning.delete(id);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete planning goal:', error);
    }
  };

  const toggleExpanded = async (id: number) => {
    if (expandedGoal === id) {
      setExpandedGoal(null);
    } else {
      setExpandedGoal(id);
      if (!deposits[id]) {
        await loadDeposits(id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-orange-500" />
      </div>
    );
  }

  const activeGoals = items.filter(item => !item.isCompleted);
  const completedGoals = items.filter(item => item.isCompleted);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Планирование бюджета</CardTitle>
          <CardDescription className="text-sm">Установите бюджет и отслеживайте траты</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Название бюджета</Label>
              <Input
                placeholder="Например: Продукты на месяц"
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Сумма бюджета</Label>
              <Input
                type="number"
                placeholder="50000"
                value={newItem.targetAmount}
                onChange={e => setNewItem({ ...newItem, targetAmount: e.target.value })}
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
              <Label>Период (опционально)</Label>
              <Input
                type="date"
                value={newItem.targetDate}
                onChange={e => setNewItem({ ...newItem, targetDate: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={addItem} className="w-full">
            <Icon name="Wallet" size={16} className="mr-2" />
            Создать бюджет
          </Button>
        </CardContent>
      </Card>

      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Активные бюджеты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map(item => {
                const category = EXPENSE_CATEGORIES.find(c => c.value === item.category);
                const spent = item.savedAmount;
                const remaining = item.targetAmount - spent;
                const progress = (spent / item.targetAmount) * 100;
                const isExpanded = expandedGoal === item.id;
                const isOverBudget = remaining < 0;

                return (
                  <div key={item.id} className="p-3 sm:p-4 bg-secondary/50 rounded-lg space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base sm:text-lg">{item.title}</h3>
                            <Badge variant="outline" className="text-xs">{category?.label}</Badge>
                          </div>
                          {item.targetDate && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              До {new Date(item.targetDate).toLocaleDateString('ru-RU')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-center py-3 bg-white rounded-lg border-2" style={{
                        borderColor: isOverBudget ? '#EF4444' : remaining < item.targetAmount * 0.2 ? '#F59E0B' : '#10B981'
                      }}>
                        <p className={`text-4xl sm:text-5xl font-bold ${
                          isOverBudget ? 'text-red-600' : remaining < item.targetAmount * 0.2 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {Math.abs(remaining).toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {isOverBudget ? 'превышен бюджет' : 'осталось в бюджете'}
                        </p>
                      </div>

                      <div className="bg-white p-2 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Бюджет:</span>
                          <span className="font-medium">
                            {item.targetAmount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Потрачено:</span>
                          <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-orange-600'}`}>
                            {spent.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(progress, 100)} 
                          className="h-2 mt-2"
                        />
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          {progress.toFixed(0)}% использовано
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Сумма траты"
                          value={editingAmount[item.id]?.amount || ''}
                          onChange={e =>
                            setEditingAmount({
                              ...editingAmount,
                              [item.id]: { 
                                ...editingAmount[item.id], 
                                amount: e.target.value 
                              }
                            })
                          }
                          className="w-full"
                        />
                        <Textarea
                          placeholder="Комментарий (опционально)"
                          value={editingAmount[item.id]?.comment || ''}
                          onChange={e =>
                            setEditingAmount({
                              ...editingAmount,
                              [item.id]: { 
                                ...editingAmount[item.id], 
                                comment: e.target.value 
                              }
                            })
                          }
                          className="w-full resize-none"
                          rows={2}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => addExpense(item.id)}
                          className="flex-1"
                          variant="default"
                        >
                          <Icon name="Minus" size={16} className="mr-2" />
                          Добавить трату
                        </Button>
                        <Button
                          onClick={() => toggleExpanded(item.id)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Icon name={isExpanded ? "ChevronUp" : "History"} size={16} className="mr-2" />
                          {isExpanded ? "Скрыть" : "История"}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 p-3 bg-white rounded-lg space-y-2 max-h-60 overflow-y-auto">
                          {deposits[item.id]?.length > 0 ? (
                            deposits[item.id].map(deposit => (
                              <div key={deposit.id}>
                                {editingDeposit?.id === deposit.id ? (
                                  <div className="p-2 bg-blue-50 rounded space-y-2">
                                    <Input
                                      type="number"
                                      value={editingDeposit.amount}
                                      onChange={e => setEditingDeposit({ ...editingDeposit, amount: e.target.value })}
                                      placeholder="Сумма"
                                      className="text-sm"
                                    />
                                    <Textarea
                                      value={editingDeposit.comment}
                                      onChange={e => setEditingDeposit({ ...editingDeposit, comment: e.target.value })}
                                      placeholder="Комментарий"
                                      className="text-sm resize-none"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => updateDeposit(item.id, deposit.id)}
                                        className="flex-1"
                                      >
                                        Сохранить
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingDeposit(null)}
                                        className="flex-1"
                                      >
                                        Отмена
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-start p-2 bg-gray-50 rounded text-xs sm:text-sm group">
                                    <div className="flex-1">
                                      <p className="font-semibold text-red-600">
                                        -{deposit.amount.toLocaleString('ru-RU')} ₽
                                      </p>
                                      {deposit.comment && (
                                        <p className="text-muted-foreground text-xs mt-1">{deposit.comment}</p>
                                      )}
                                      <p className="text-muted-foreground text-xs mt-1">
                                        {new Date(deposit.createdAt).toLocaleString('ru-RU', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingDeposit({
                                          id: deposit.id,
                                          amount: deposit.amount.toString(),
                                          comment: deposit.comment
                                        })}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Icon name="Edit2" size={12} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteDeposit(item.id, deposit.id)}
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                      >
                                        <Icon name="Trash2" size={12} />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground text-sm py-4">
                              История трат пуста
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => toggleCompleted(item.id, item.isCompleted)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Icon name="Check" size={14} className="mr-1" />
                          Завершить
                        </Button>
                        <Button
                          onClick={() => deleteItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Завершенные бюджеты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedGoals.map(item => {
                const category = EXPENSE_CATEGORIES.find(c => c.value === item.category);
                const spent = item.savedAmount;
                const remaining = item.targetAmount - spent;
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 rounded-lg opacity-70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <h3 className="font-semibold text-sm line-through">{item.title}</h3>
                          <Badge variant="outline" className="text-xs">{category?.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Потрачено: {spent.toLocaleString('ru-RU')} ₽ из {item.targetAmount.toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {remaining >= 0 ? `Осталось: ${remaining.toLocaleString('ru-RU')} ₽` : `Перерасход: ${Math.abs(remaining).toLocaleString('ru-RU')} ₽`}
                        </p>
                      </div>
                      <Button
                        onClick={() => deleteItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlanningTab;