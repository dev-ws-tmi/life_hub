import { useState } from 'react';
import { X, Scale, Save, Ruler } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useHealthStore } from '@/shared/stores/useHealthStore';
import toast from 'react-hot-toast';

interface WeightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeightModal({ isOpen, onClose }: WeightModalProps) {
  const { addWeightEntry, weightEntries, heightCm, setHeightCm } = useHealthStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const lastWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : 64.2;

  const [date, setDate] = useState(todayStr);
  const [weightKg, setWeightKg] = useState<number>(lastWeight);
  const [inputHeightCm, setInputHeightCm] = useState<number>(heightCm);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg || weightKg <= 0) {
      toast.error('Introdueix un pes vàlid');
      return;
    }

    if (inputHeightCm && inputHeightCm > 0) {
      setHeightCm(Number(inputHeightCm));
    }

    addWeightEntry(Number(weightKg), date, notes.trim() || undefined);
    toast.success('Pes i alçada registrats correctament!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-5 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Registrar Pes i Alçada</h3>
              <p className="text-xs text-[var(--text-secondary)]">Afegeix una lectura del pes i actualitza l'alçada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Data de la mesura</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Pes en Quilograms (kg)</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-lg font-bold text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-4 text-xs font-bold text-[var(--text-muted)]">kg</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
              <Ruler size={13} className="text-brand-500" /> Actualitzar Alçada (cm)
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                min="50"
                max="250"
                value={inputHeightCm}
                onChange={(e) => setInputHeightCm(Number(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-4 text-xs font-bold text-[var(--text-muted)]">cm</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">L'alçada només es pot actualitzar en registrar un nou pes</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Notes u observacions (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Ex: En dejú al matí, després d'entrenar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel·lar
            </Button>
            <Button type="submit">
              <Save size={16} /> Guardar Pes & Alçada
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
