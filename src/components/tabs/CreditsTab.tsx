import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { api, Credit } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CreditsTabProps {
  onUpdate?: () => void;
}

const CreditsTab = ({ onUpdate }: CreditsTabProps) => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    totalDebt: '',
    interestRate: '',
    monthlyPayment: '',
    paymentDay: '1',
  });

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const data = await api.credits.getAll();
      setCredits(data);
    } catch {
      toast({ title: 'Ошибка загрузки кредитов', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', totalDebt: '', interestRate: '', monthlyPayment: '', paymentDay: '1' });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.title || !form.totalDebt || !form.interestRate || !form.monthlyPayment) return;

    try {
      const payload = {
        title: form.title,
        totalDebt: parseFloat(form.totalDebt),
        interestRate: parseFloat(form.interestRate),
        monthlyPayment: parseFloat(form.monthlyPayment),
        paymentDay: parseInt(form.paymentDay),
      };

      if (editingId) {
        await api.credits.update({ id: editingId, ...payload });
        toast({ title: 'Кредит обновлён' });
      } else {
        await api.credits.add(payload);
        toast({ title: 'Кредит добавлен' });
      }

      resetForm();
      await loadCredits();
      onUpdate?.();
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    }
  };

  const handleEdit = (credit: Credit) => {
    setEditingId(credit.id);
    setForm({
      title: credit.title,
      totalDebt: String(credit.totalDebt),
      interestRate: String(credit.interestRate),
      monthlyPayment: String(credit.monthlyPayment),
      paymentDay: String(credit.paymentDay),
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await api.credits.delete(id);
      await loadCredits();
      onUpdate?.();
      toast({ title: 'Кредит удалён' });
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  };

  const handleAskAI = async () => {
    setAiLoading(true);
    setAiAnswer('');
    try {
      const answer = await api.credits.askAI(question);
      setAiAnswer(answer);
    } catch {
      toast({ title: 'Ошибка AI-анализа', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const totalDebt = credits.reduce((s, c) => s + c.totalDebt, 0);
  const totalMonthly = credits.reduce((s, c) => s + c.monthlyPayment, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Кредиты</CardTitle>
          <CardDescription className="text-sm">
            Общий долг: {totalDebt.toLocaleString('ru-RU')} ₽ · Платежей в месяц: {totalMonthly.toLocaleString('ru-RU')} ₽
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label>Название</Label>
              <Input placeholder="Ипотека" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Остаток долга, ₽</Label>
              <Input type="number" placeholder="500000" value={form.totalDebt} onChange={e => setForm({ ...form, totalDebt: e.target.value })} />
            </div>
            <div>
              <Label>Ставка, % годовых</Label>
              <Input type="number" step="0.1" placeholder="18.5" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} />
            </div>
            <div>
              <Label>Платёж в месяц, ₽</Label>
              <Input type="number" placeholder="15000" value={form.monthlyPayment} onChange={e => setForm({ ...form, monthlyPayment: e.target.value })} />
            </div>
            <div>
              <Label>День платежа</Label>
              <Input type="number" min="1" max="31" placeholder="15" value={form.paymentDay} onChange={e => setForm({ ...form, paymentDay: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Icon name={editingId ? 'Save' : 'Plus'} size={16} className="mr-1" />
              {editingId ? 'Сохранить' : 'Добавить кредит'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>Отмена</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {credits.length > 0 && (
        <div className="space-y-3">
          {credits.map(credit => (
            <Card key={credit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm sm:text-base">{credit.title}</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {credit.interestRate}% годовых
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm text-muted-foreground">
                      <div>
                        <span className="text-xs text-muted-foreground block">Долг</span>
                        <span className="font-medium text-foreground">{credit.totalDebt.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Платёж</span>
                        <span className="font-medium text-foreground">{credit.monthlyPayment.toLocaleString('ru-RU')} ₽/мес</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Дата</span>
                        <span className="font-medium text-foreground">каждый {credit.paymentDay}-й день</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(credit)}>
                      <Icon name="Pencil" size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(credit.id)} className="text-red-500 hover:text-red-700">
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {credits.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Добавьте кредиты выше, чтобы AI мог их проанализировать
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon name="Bot" size={20} className="text-blue-600" />
            AI-помощник по кредитам
          </CardTitle>
          <CardDescription className="text-sm">
            Задай вопрос или получи автоматический анализ твоей кредитной нагрузки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Например: какой кредит выгоднее погасить досрочно? Или на сколько мне хватит свободных денег?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={2}
          />
          <Button
            onClick={handleAskAI}
            disabled={aiLoading || credits.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            {aiLoading ? (
              <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Анализирую...</>
            ) : (
              <><Icon name="Sparkles" size={16} className="mr-2" />Получить анализ</>
            )}
          </Button>

          {aiAnswer && (
            <div className="mt-3 p-4 bg-white rounded-lg border border-blue-100 text-sm leading-relaxed whitespace-pre-wrap">
              {aiAnswer}
            </div>
          )}

          {credits.length === 0 && (
            <p className="text-xs text-muted-foreground">Сначала добавьте хотя бы один кредит</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsTab;
