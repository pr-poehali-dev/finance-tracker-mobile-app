import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

export default function LoginPage() {
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
            Войдите, чтобы управлять своими финансами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => api.auth.login()}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Icon name="LogIn" size={20} className="mr-2" />
            Войти через Google
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Безопасная авторизация через Google
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
