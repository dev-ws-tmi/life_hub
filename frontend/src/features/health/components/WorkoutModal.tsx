import { useState } from 'react';
import { X, Dumbbell, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useHealthStore, type WorkoutType, type WorkoutIntensity } from '@/shared/stores/useHealthStore';
import toast from 'react-hot-toast';

const WORKOUT_TYPES: Array<{ type: WorkoutType; label: string; icon: string }> = [
  { type: 'GYM', label: 'Gimnàs / Força', icon: '🏋️‍♂️' },
  { type: 'RUNNING', label: 'Cursa / Running', icon: '🏃‍♂️' },
  { type: 'WALKING', label: 'Caminada', icon: '🚶‍♂️' },
  { type: 'CYCLING', label: 'Ciclisme', icon: '🚴‍♂️' },
  { type: 'YOGA', label: 'Ioga / Estiraments', icon: '🧘‍♀️' },
  { type: 'SWIMMING', label: 'Natació', icon: '🏊‍♂️' },
  { type: 'OTHER', label: 'Altra activitat', icon: '⚡' },
];

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkoutModal({ isOpen, onClose }: WorkoutModalProps) {
  const { addWorkout } = useHealthStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [type, setType] = useState<WorkoutType>('GYM');
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [caloriesBurned, setCaloriesBurned] = useState<number | undefined>(300);
  const [intensity, setIntensity] = useState<WorkoutIntensity>('MEDIUM');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedTypeObj = WORKOUT_TYPES.find((t) => t.type === type);
    const finalName = name.trim() || selectedTypeObj?.label || 'Activitat Física';

    addWorkout({
      date,
      type,
      name: finalName,
      durationMinutes: Number(durationMinutes),
      caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
      intensity,
      notes: notes.trim() || undefined,
    });

    toast.success('Entrenament registrat amb èxit!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Dumbbell size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Registrar Entrenament</h3>
              <p className="text-xs text-[var(--text-secondary)]">Afegeix la teva sessió d'activitat física</p>
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
          {/* Tipus d'activitat */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Tipus d'Activitat</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WORKOUT_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setType(item.type);
                    if (!name || WORKOUT_TYPES.some(t => t.label === name)) {
                      setName(item.label);
                    }
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    type === item.type
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-semibold shadow-sm'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nom de l'activitat */}
          <Input
            id="workout-name"
            label="Títol de la Sessió"
            placeholder="Ex: Rutina de Pit i Tríceps, Cursa 5km..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Data, Durada, Calories */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Data</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Durada (minuts)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Calories (kcal)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="300"
                  value={caloriesBurned ?? ''}
                  onChange={(e) => setCaloriesBurned(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Intensitat */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Intensitat</label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as WorkoutIntensity[]).map((inst) => {
                const label = inst === 'LOW' ? '🟢 Baixa' : inst === 'MEDIUM' ? '🟡 Mitjana' : '🔴 Alta';
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setIntensity(inst)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      intensity === inst
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Notes o comentaris</label>
            <textarea
              rows={2}
              placeholder="Sensacions, pes aixecat, ritme per km..."
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
              <Sparkles size={16} /> Guardar Entrenament
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
