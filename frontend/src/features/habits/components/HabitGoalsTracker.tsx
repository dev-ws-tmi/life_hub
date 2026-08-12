import { useState } from 'react';
import { useHabitsStore } from '@/shared/stores/useHabitsStore';
import { useHabitsActions } from '@/features/habits/hooks/useHabitsActions';
import { Plus, Target, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import toast from 'react-hot-toast';

export default function HabitGoalsTracker() {
  const { goals, habits } = useHabitsStore();
  const actions = useHabitsActions();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [habitId, setHabitId] = useState('GLOBAL');
  const [type, setType] = useState<'TOTAL_COUNT' | 'STREAK_RECORD' | 'DURATION_TOTAL'>('TOTAL_COUNT');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) {
      toast.error('El títol i el valor objectiu són obligatoris');
      return;
    }

    try {
      await actions.addGoal({
        title,
        habitId,
        type,
        targetValue: parseFloat(targetValue),
        deadline: deadline || null,
      });
      toast.success('Objectiu creat correctament! 🎯');
      setModalOpen(false);
      setTitle('');
      setTargetValue('');
      setDeadline('');
    } catch (err) {
      toast.error('Error al crear l\'objectiu');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Segur que vols eliminar aquest objectiu?')) {
      try {
        await actions.deleteGoal(id);
        toast.success('Objectiu eliminat');
      } catch (err) {
        toast.error('Error al eliminar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-sm text-[var(--text-primary)]">Fites i Objectius a Llarg Termini</h4>
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Controla grans reptes personals</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nou Objectiu
        </Button>
      </div>

      {/* Goals list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const linkedHabit = habits.find(h => h.id === g.habitId);
          const isAchieved = g.status === 'ACHIEVED';
          const pct = Math.min((g.currentValue / g.targetValue) * 100, 100);

          return (
            <div key={g.id} className={`card p-5 space-y-3 relative overflow-hidden transition-all ${
              isAchieved ? 'border-emerald-500/30 bg-emerald-500/5' : ''
            }`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isAchieved ? 'bg-emerald-500/20 text-emerald-500' : 'bg-brand-500/10 text-brand-500'
                  }`}>
                    <Target size={16} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      {g.title}
                      {isAchieved && <CheckCircle size={12} className="text-emerald-500 fill-emerald-500/20" />}
                    </h5>
                    <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">
                      {linkedHabit ? `Vinculat a: ${linkedHabit.title}` : 'Objectiu global'}
                      {g.deadline && ` · Límit: ${g.deadline}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-[var(--text-muted)] hover:text-red-500 p-1 cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)]">
                  <span>Progrés</span>
                  <span>{g.currentValue} / {g.targetValue} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isAchieved ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-1">
            <p className="text-xs text-[var(--text-muted)]">No hi ha cap objectiu registrat.</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Crea un repte per motivar el teu seguiment.</p>
          </div>
        )}
      </div>

      {/* Goal creation modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-premium" onClick={() => setModalOpen(false)} />
          <form onSubmit={handleCreateGoal} className="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl shadow-xl p-6 space-y-4 animate-scale-in">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Crea un nou Objectiu</h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Títol de l'objectiu</label>
              <Input
                type="text"
                placeholder="Ex: Anar al gimnàs 100 vegades, Llegir 12 llibres"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Vinculació</label>
              <select
                value={habitId}
                onChange={e => setHabitId(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
              >
                <option value="GLOBAL">Objectiu Global</option>
                {habits.map(h => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mètrica</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full h-10 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-150"
                >
                  <option value="TOTAL_COUNT">Vegades completat</option>
                  <option value="STREAK_RECORD">Record de ratxa diària</option>
                  <option value="DURATION_TOTAL">Suma total de valor/temps</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Valor fita</label>
                <Input
                  type="number"
                  placeholder="Ex: 100, 30"
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Data límit (Opcional)</label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)] mt-4">
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                Cancel·la
              </Button>
              <Button type="submit">
                Crea l'objectiu
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
