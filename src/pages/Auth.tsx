import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Blocks, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { SimpleCaptcha } from '@/components/SimpleCaptcha';
import { useRateLimit } from '@/hooks/useRateLimit';

const signUpSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа').max(20, 'Максимум 20 символов').regex(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и _'),
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

const signInSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Введите username или email'),
  password: z.string().min(1, 'Введите пароль'),
});

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { checkRateLimit } = useRateLimit();
  
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    usernameOrEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCaptchaVerify = useCallback((verified: boolean) => {
    setCaptchaVerified(verified);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Ошибка входа через Google',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // For signup, require captcha
    if (mode === 'signup' && !captchaVerified) {
      toast({
        title: 'Подтвердите что вы не бот',
        description: 'Решите математический пример',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting check
    const actionType = mode === 'signup' ? 'signup' : 'login';
    const allowed = await checkRateLimit({
      actionType,
      maxRequests: mode === 'signup' ? 3 : 5,
      windowSeconds: 60,
    });
    
    if (!allowed) return;

    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.username);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Ошибка',
              description: 'Пользователь с таким email уже существует',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Ошибка регистрации',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Успешная регистрация!',
            description: 'Добро пожаловать в MCLeak',
          });
          navigate('/');
        }
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const identifier = formData.usernameOrEmail.trim();

        // Email login: use the regular client flow
        if (identifier.includes('@')) {
          const { error } = await signIn(identifier, formData.password);
          if (error) {
            toast({
              title: 'Ошибка входа',
              description: 'Неверный username/email или пароль',
              variant: 'destructive',
            });
          } else {
            navigate('/');
          }
          return;
        }

        // Username login: do a secure server-side lookup (does NOT expose emails publicly)
        const { data, error: fnError } = await supabase.functions.invoke('username-login', {
          body: {
            username: identifier,
            password: formData.password,
          },
        });

        if (fnError) {
          toast({
            title: 'Ошибка входа',
            description: 'Не удалось выполнить вход. Попробуйте позже.',
            variant: 'destructive',
          });
          return;
        }

        if (!data?.access_token || !data?.refresh_token) {
          toast({
            title: 'Ошибка входа',
            description: data?.error ?? 'Неверный username или пароль',
            variant: 'destructive',
          });
          return;
        }

        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (setSessionError) {
          toast({
            title: 'Ошибка входа',
            description: 'Не удалось сохранить сессию. Попробуйте ещё раз.',
            variant: 'destructive',
          });
          return;
        }

        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{mode === 'login' ? 'Вход' : 'Регистрация'} | TestLeak</title>
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        
        <Link to="/" className="relative flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
            <Blocks className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-sm text-primary">TestLeak</span>
        </Link>

        <Card className="relative w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {mode === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' 
                ? 'Введите username или email для входа'
                : 'Заполните форму для регистрации'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 gap-2"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Войти через Google
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Имя пользователя</Label>
                    <Input
                      id="username"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={errors.username ? 'border-destructive' : ''}
                    />
                    {errors.username && (
                      <p className="text-xs text-destructive">{errors.username}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="usernameOrEmail">Username или Email</Label>
                  <Input
                    id="usernameOrEmail"
                    placeholder="username или email@example.com"
                    value={formData.usernameOrEmail}
                    onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                    className={errors.usernameOrEmail ? 'border-destructive' : ''}
                  />
                  {errors.usernameOrEmail && (
                    <p className="text-xs text-destructive">{errors.usernameOrEmail}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Captcha for signup */}
              {mode === 'signup' && (
                <SimpleCaptcha onVerify={handleCaptchaVerify} />
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || (mode === 'signup' && !captchaVerified)}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Нет аккаунта?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline"
                  >
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline"
                  >
                    Войти
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
