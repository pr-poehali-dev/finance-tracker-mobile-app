import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Введите корректный email');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await api.auth.sendCode(email);
    
    setLoading(false);

    if (result.success) {
      setStep('code');
      setMessage('Код отправлен на ваш email');
    } else {
      setError(result.error || 'Не удалось отправить код');
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await api.auth.verifyCode(email, code);
    
    setLoading(false);

    if (result.success && result.token) {
      api.auth.setToken(result.token);
      window.location.reload();
    } else {
      setError(result.error || 'Неверный код');
    }
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Icon name="Wallet" size={32} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Финансовый трекер</CardTitle>
          <CardDescription className="text-base mt-2">
            {step === 'email' ? 'Войдите с помощью email' : 'Введите код из письма'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleSendCode)}
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <Icon name="AlertCircle" size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full h-12 text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Отправляем...
                  </>
                ) : (
                  <>
                    <Icon name="Mail" size={20} className="mr-2" />
                    Получить код
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code">Код из письма</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setError('');
                      setMessage('');
                    }}
                    className="h-auto p-0 text-xs text-orange-600 hover:text-orange-700"
                  >
                    Изменить email
                  </Button>
                </div>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleVerifyCode)}
                  disabled={loading}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Код отправлен на: <span className="font-medium">{email}</span>
                </p>
              </div>

              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
                  <Icon name="CheckCircle" size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <Icon name="AlertCircle" size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="w-full h-12 text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Проверяем...
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" size={20} className="mr-2" />
                    Войти
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full"
              >
                Отправить код повторно
              </Button>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground pt-2">
            Код действителен 10 минут
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
