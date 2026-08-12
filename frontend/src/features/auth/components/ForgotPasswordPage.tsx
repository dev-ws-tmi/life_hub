import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Introdueix el teu correu'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError('No s\'ha pogut enviar el correu. Verifica l\'adreça.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[oklch(68%_0.18_160_/_0.15)] flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-[oklch(52%_0.18_160)]" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
            Correu enviat!
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Hem enviat les instruccions de recuperació a{' '}
            <strong className="text-[var(--text-primary)]">{email}</strong>.
            Revisa la carpeta de correu no desitjat si no el trobes.
          </p>
        </div>
        <Link to="/auth/login">
          <Button variant="secondary" fullWidth>
            <ArrowLeft size={16} />
            Torna a l'inici de sessió
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display font-bold text-3xl text-[var(--text-primary)]">
          Recupera la contrasenya
        </h1>
        <p className="text-[var(--text-secondary)]">
          Introdueix el teu correu i t'enviarem les instruccions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="forgot-email"
          type="email"
          label="Correu electrònic"
          placeholder="nom@exemple.cat"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          error={error}
          leftIcon={Mail}
          autoComplete="email"
          required
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Enviar instruccions
        </Button>
      </form>

      <Link
        to="/auth/login"
        className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={14} />
        Torna a l'inici de sessió
      </Link>
    </div>
  );
}
