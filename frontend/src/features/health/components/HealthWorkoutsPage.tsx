import { useState } from 'react';
import { Dumbbell, Trash2, Eye, Search } from 'lucide-react';
import { useHealthStore } from '@/shared/stores/useHealthStore';
import type { HevyWorkout } from '../services/hevyApi';
import toast from 'react-hot-toast';

interface HealthWorkoutsPageProps {
  onOpenWorkoutModal: () => void;
  onSelectHevyWorkout: (workout: HevyWorkout) => void;
}

export default function HealthWorkoutsPage({
  onSelectHevyWorkout,
}: HealthWorkoutsPageProps) {
  const { workouts, deleteWorkout } = useHealthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkouts = workouts.filter((w) => {
    const query = searchQuery.toLowerCase();
    return (
      w.name.toLowerCase().includes(query) ||
      w.date.includes(query) ||
      (w.hevyDetails && w.hevyDetails.exercises.some((ex) => ex.title.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Cerca per nom de la rutina, exercici o data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500 shadow-sm"
        />
      </div>

      {/* Workouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkouts.map((w) => (
          <div
            key={w.id}
            onClick={() => w.hevyDetails && onSelectHevyWorkout(w.hevyDetails)}
            className={`bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm space-y-3 transition-all flex flex-col justify-between ${
              w.hevyDetails ? 'cursor-pointer hover:border-brand-500/60 hover:shadow-md' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-2xl">
                  {w.type === 'GYM' ? '🏋️‍♂️' : w.type === 'RUNNING' ? '🏃‍♂️' : w.type === 'WALKING' ? '🚶‍♂️' : w.type === 'CYCLING' ? '🚴‍♂️' : w.type === 'YOGA' ? '🧘‍♀️' : '⚡'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-base text-[var(--text-primary)]">{w.name}</h4>
                    {w.source === 'HEVY' && (
                      <span className="text-[9px] font-bold bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full">
                        Hevy App
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{w.date}</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWorkout(w.id);
                  toast.success('Entrenament eliminat.');
                }}
                className="text-[var(--text-muted)] hover:text-red-500 p-1.5 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
              <span>⏱️ {w.durationMinutes} minuts</span>
              {w.caloriesBurned && <span>🔥 ~{w.caloriesBurned} kcal</span>}
              <span className="ml-auto font-bold text-brand-500">
                Intensitat: {w.intensity === 'HIGH' ? '🔴 Alta' : w.intensity === 'MEDIUM' ? '🟡 Mitjana' : '🟢 Baixa'}
              </span>
            </div>

            {w.hevyDetails && (
              <div className="bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium truncate pr-2">
                  {w.hevyDetails.exercises.length} exercicis ({w.hevyDetails.exercises.map(e => e.title).slice(0, 3).join(', ')})
                </span>
                <span className="text-brand-500 font-bold flex items-center gap-1 flex-shrink-0">
                  <Eye size={14} /> Detalls
                </span>
              </div>
            )}
          </div>
        ))}

        {filteredWorkouts.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl space-y-3">
            <Dumbbell size={32} className="mx-auto text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Sense entrenaments que coincideixin</p>
          </div>
        )}
      </div>

    </div>
  );
}
