
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="card p-8 md:p-16 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-6 text-brand-500 animate-pulse">
        <Sparkles size={32} />
      </div>
      <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
        Mòdul de {title}
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mb-8 max-w-sm mx-auto">
        Aquest mòdul del teu Personal Life Hub està actualment en fase de disseny. Molt aviat podràs gestionar tota la teva activitat de {title.toLowerCase()} des d'aquí.
      </p>
      <Button onClick={() => navigate('/dashboard')} variant="secondary">
        <ArrowLeft size={16} /> Tornar al Tauler
      </Button>
    </div>
  );
}
