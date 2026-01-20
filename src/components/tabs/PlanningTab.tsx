import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api, PlanningGoal } from '@/lib/api';

const PLANNING_CATEGORIES = [
  { value: 'vacation', label: 'Отпуск' },
  { value: 'gadget', label: 'Гаджеты' },
  { value: 'car', label: 'Автомобиль' },
  { value: 'home', label: 'Жильё' },
  { value: 'education', label: 'Образование' },
  { value: 'other', label: 'Прочее' },
];

const PlanningTab = () => {
  const [items, setItems] = useState<PlanningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    title: '',
    targetAmount: '',
    category: 'vacation',
    targetDate: '',
  });
  const [editingSaved, setEditingSaved] = useState<{ [key: number]: string }>({});

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

  const addItem = async () => {
    if (!newItem.title || !newItem.targetAmount) return;

    try {
      await api.planning.add({
        title: newItem.title,
        targetAmount: parseFloat(newItem.targetAmount),
        category: newItem.category,
        targetDate: newItem.targetDate || undefined,
      });

      setNewItem({ title: '', targetAmount: '', category: 'vacation', targetDate: '' });
      await loadItems();
    } catch (error) {
      console.error('Failed to add planning goal:', error);
    }
  };

  const updateSaved = async (id: number) => {
    const value = editingSaved[id];
    if (!value) return;

    try {
      await api.planning.update(id, { savedAmount: parseFloat(value) });
      setEditingSaved({ ...editingSaved, [id]: '' });
      await loadItems();
    } catch (error) {
      console.error('Failed to update saved amount:', error);
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
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle>Планирование покупок</CardTitle>
          <CardDescription>Ставьте финансовые цели и отслеживайте прогресс</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Название цели</Label>
              <Input
                placeholder="iPhone 15"
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Целевая сумма</Label>
              <Input
                type="number"
                placeholder="0"
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
                  {PLANNING_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Дата цели (опционально)</Label>
              <Input
                type="date"
                value={newItem.targetDate}
                onChange={e => setNewItem({ ...newItem, targetDate: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={addItem} className="w-full">
            <Icon name="Target" size={16} className="mr-2" />
            Добавить цель
          </Button>
        </CardContent>
      </Card>

      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Активные цели</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map(item => {
                const category = PLANNING_CATEGORIES.find(c => c.value === item.category);
                const progress = (item.savedAmount / item.targetAmount) * 100;
                const remaining = item.targetAmount - item.savedAmount;

                return (
                  <div key={item.id} className="p-4 bg-secondary/50 rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <Badge variant="outline">{category?.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.targetDate && `До ${new Date(item.targetDate).toLocaleDateString('ru-RU')}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {item.savedAmount.toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="text-sm text-muted-foreground">
                          из {item.targetAmount.toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Прогресс: {progress.toFixed(0)}%</span>
                        <span className="text-orange-600 font-medium">
                          Осталось: {remaining.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Input
                        type="number"
                        placeholder="Добавить сумму"
                        value={editingSaved[item.id] || ''}
                        onChange={e =>
                          setEditingSaved({ ...editingSaved, [item.id]: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => updateSaved(item.id)}
                        disabled={!editingSaved[item.id]}
                      >
                        <Icon name="Plus" size={14} className="mr-1" />
                        Внести
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCompleted(item.id, item.isCompleted)}
                        title="Отметить как выполненную"
                      >
                        <Icon name="Check" size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Icon name="Trash2" size={14} className="text-destructive" />
                      </Button>
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
            <CardTitle className="flex items-center gap-2">
              <Icon name="CheckCircle2" size={20} className="text-green-600" />
              Выполненные цели
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedGoals.map(item => {
                const category = PLANNING_CATEGORIES.find(c => c.value === item.category);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon name="CheckCircle2" size={16} className="text-green-600" />
                        <p className="font-medium">{item.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {category?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {item.targetAmount.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleCompleted(item.id, item.isCompleted)}
                        title="Вернуть в активные"
                      >
                        <Icon name="RotateCcw" size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Icon name="Trash2" size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Target" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Пока нет целей для планирования</p>
          <p className="text-sm mt-2">Добавьте цель и начните копить на мечту</p>
        </div>
      )}
    </div>
  );
};

export default PlanningTab;
