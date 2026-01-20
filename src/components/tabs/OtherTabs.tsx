import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Transaction } from '@/lib/api';

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

interface OtherTabsProps {
  user: User;
  expenses: Transaction[];
  monthlyIncome: number;
  monthlyExpenses: number;
  regularExpenses: number;
  fixedExpenses: number;
  isCurrentMonth: boolean;
  currentDate: Date;
  daysInMonth: number;
  daysRemaining: number;
  dailyAverage: number;
  projectedExpenses: number;
  projectedBalance: number;
  expensesByCategory: Array<{ name: string; value: number; color: string }>;
}

export const ForecastTab = ({
  expenses,
  regularExpenses,
  fixedExpenses,
  isCurrentMonth,
  currentDate,
  daysInMonth,
  daysRemaining,
  dailyAverage,
  projectedExpenses,
  projectedBalance,
  expensesByCategory,
}: OtherTabsProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
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
                {fixedExpenses > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-300">
                    <p className="text-xs text-purple-700">Обычные: {(projectedExpenses - fixedExpenses).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</p>
                    <p className="text-xs text-purple-700">Фиксир.: {fixedExpenses.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</p>
                  </div>
                )}
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
                  {fixedExpenses > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      (включая {fixedExpenses.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ фиксированных расходов)
                    </p>
                  )}
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
    </div>
  );
};

export const SettingsTab = ({ user }: { user: User }) => {
  return (
    <div className="space-y-6 animate-fade-in">
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
    </div>
  );
};