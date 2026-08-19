import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, loginWithGoogle, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'El correu és obligatori';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format de correu invàlid';
    if (!password) errs.password = 'La contrasenya és obligatòria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Benvingut/da!');
    } catch (err: any) {
      toast.error(err.message || 'Error en iniciar sessió');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Benvingut/da!');
    } catch (err: any) {
      toast.error(err.message || 'Error en l’autenticació amb Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Capçalera */}
      <div className="space-y-1">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(58%_0.22_290)] to-[oklch(62%_0.25_305)] flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">E</span>
          </div>
          <span className="font-display font-bold text-gradient">Estudi360</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-[var(--text-primary)]">
          Accedeix al teu compte
        </h1>
        <p className="text-[var(--text-secondary)]">
          Benvingut/da de nou! Inicia sessió per continuar.
        </p>
      </div>

      {/* Formulari */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="login-email"
          type="email"
          label="Correu electrònic"
          placeholder="nom@exemple.cat"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
          error={errors.email}
          leftIcon={Mail}
          autoComplete="email"
          required
        />

        <Input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          label="Contrasenya"
          placeholder="La teva contrasenya"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
          error={errors.password}
          leftIcon={Lock}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconClick={() => setShowPassword((v) => !v)}
          autoComplete="current-password"
          required
        />

        <div className="flex justify-end">
          <Link
            to="/auth/recuperar"
            className="text-sm text-[oklch(58%_0.22_290)] hover:underline"
          >
            Has oblidat la contrasenya?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading || authLoading}
        >
          Iniciar sessió
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-subtle)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[var(--bg-base)] text-[var(--text-muted)]">
            o continua amb
          </span>
        </div>
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="secondary"
        fullWidth
        size="lg"
        loading={googleLoading}
        onClick={handleGoogle}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continua amb Google
      </Button>
    </div>
  );
}
