import { X, Info } from 'lucide-react';
import type { HevyWorkout } from '../services/hevyApi';

interface HevyDetailsModalProps {
  workout: HevyWorkout | null;
  onClose: () => void;
}

export default function HevyDetailsModal({ workout, onClose }: HevyDetailsModalProps) {
  if (!workout) return null;

  const startDate = new Date(workout.start_time);
  const endDate = new Date(workout.end_time);
  const durationMins = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} minuts`;

  // Calculate total volume and total reps
  let totalVolumeKg = 0;
  let totalReps = 0;
  let totalSets = 0;

  workout.exercises.forEach((ex) => {
    ex.sets.forEach((st) => {
      totalSets++;
      totalReps += st.reps || 0;
      totalVolumeKg += (st.weight_kg || 0) * (st.reps || 0);
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4 bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md">
              💪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-md">
                  Hevy Sync
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {startDate.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-[var(--text-primary)] mt-1">{workout.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-3 border-b border-[var(--border-subtle)] p-4 text-center bg-[var(--bg-raised)] divide-x divide-[var(--border-subtle)]">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">Durada</span>
            <span className="text-base font-bold text-[var(--text-primary)]">{durationText}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">Volum Total</span>
            <span className="text-base font-bold text-brand-500">{totalVolumeKg.toLocaleString('ca-ES')} kg</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">Sèries / Repeticions</span>
            <span className="text-base font-bold text-[var(--text-primary)]">{totalSets} sèries ({totalReps} reps)</span>
          </div>
        </div>

        {/* Description / Notes */}
        {workout.description && (
          <div className="px-6 py-3 bg-[var(--bg-elevated)]/50 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
            <Info size={14} className="text-brand-500 flex-shrink-0" />
            <span className="italic">"{workout.description}"</span>
          </div>
        )}

        {/* Exercises List */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {workout.exercises.map((ex, idx) => (
            <div key={ex.exercise_template_id + idx} className="space-y-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  {ex.title}
                </h4>
                {ex.notes && <span className="text-[11px] text-[var(--text-muted)] italic">{ex.notes}</span>}
              </div>

              {/* Sets Table */}
              <div className="space-y-1">
                <div className="grid grid-cols-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 pb-1">
                  <span>Sèrie</span>
                  <span>Tipus</span>
                  <span>Pes</span>
                  <span>Repeticions</span>
                </div>
                {ex.sets.map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="grid grid-cols-4 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-raised)] p-2 rounded-lg items-center border border-[var(--border-subtle)]"
                  >
                    <span className="text-[var(--text-muted)]">#{sIdx + 1}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-max ${
                      st.type === 'warmup' ? 'bg-amber-500/10 text-amber-500' : st.type === 'dropset' ? 'bg-purple-500/10 text-purple-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {st.type === 'warmup' ? 'Escalfament' : st.type === 'dropset' ? 'Drop set' : 'Normal'}
                    </span>
                    <span>{st.weight_kg !== null ? `${st.weight_kg} kg` : '—'}</span>
                    <span>{st.reps !== null ? `${st.reps} reps` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
