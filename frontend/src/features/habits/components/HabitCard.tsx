import { useState } from 'react';
import { useHabitsStore, calculateStreak, type Habit, type LogStatus } from '@/shared/stores/useHabitsStore';
import { useHabitsActions } from '@/features/habits/hooks/useHabitsActions';
import {
  Check, Flame, MessageSquare, Plus, Minus,
  Droplet, BookOpen, Heart, Flame as FlameIcon, Home, Brain, Apple, Activity, Sparkles, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

// Icon Map resolver
export const ICON_MAP: Record<string, any> = {
  Droplet, BookOpen, Heart, Flame: FlameIcon, Home, Brain, Apple, Activity, Sparkles, Target
};

interface HabitCardProps {
  habit: Habit;
  date: string;
}

export default function HabitCard({ habit, date }: HabitCardProps) {
  const { logs } = useHabitsStore();
  const actions = useHabitsActions();
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Find existing log for this date
  const logId = `${habit.id}_${date}`;
  const log = logs.find(l => l.id === logId);
  
  const currentStatus = log?.status || 'FAILED';
  const currentValue = log?.value || 0;
  const currentNotes = log?.notes || '';

  // Get streaks
  const { current: activeStreak } = calculateStreak(logs, habit.id);

  // Icon component resolver
  const IconComponent = ICON_MAP[habit.icon] || Sparkles;

  const handleToggleBinary = async () => {
    try {
      const nextStatus: LogStatus = currentStatus === 'COMPLETED' ? 'FAILED' : 'COMPLETED';
      await actions.logCheckIn(habit.id, date, nextStatus, nextStatus === 'COMPLETED' ? 1 : 0);
      toast.success(nextStatus === 'COMPLETED' ? 'Hàbit completat! 🎉' : 'Hàbit desmarcat.');
    } catch (e) {
      toast.error('Error al registrar l\'hàbit');
    }
  };

  const handleQuantityChange = async (delta: number) => {
    try {
      const nextVal = Math.max(0, currentValue + delta);
      const nextStatus: LogStatus = nextVal >= habit.goalValue ? 'COMPLETED' : 'PARTIAL';
      await actions.logCheckIn(habit.id, date, nextStatus, nextVal, currentNotes);
    } catch (e) {
      toast.error('Error al registrar');
    }
  };

  const handleSaveNote = async () => {
    try {
      await actions.logCheckIn(habit.id, date, currentStatus, currentValue, noteText);
      setShowNoteInput(false);
      toast.success('Nota guardada correctament');
    } catch (e) {
      toast.error('Error al guardar la nota');
    }
  };

  return (
    <div className={`card p-4 flex flex-col justify-between transition-all select-none ${
      currentStatus === 'COMPLETED' ? 'bg-gradient-to-br from-brand-500/5 via-[var(--bg-raised)] to-transparent border-brand-500/20' : ''
    }`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3">
          {/* Category-colored Icon circle */}
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
            style={{ backgroundColor: habit.color }}
          >
            <IconComponent size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate">{habit.title}</h4>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">{habit.description}</p>
          </div>
        </div>

        {/* Streak Flame */}
        {activeStreak > 0 && (
          <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] font-bold">
            <Flame size={12} className="fill-amber-500 animate-pulse" />
            <span>{activeStreak} d</span>
          </div>
        )}
      </div>

      {/* Progress and controls depending on GoalType */}
      <div className="mt-4 flex items-center justify-between gap-4">
        {habit.goalType === 'BINARY' ? (
          <div className="w-full flex justify-between items-center">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Sí / No</span>
            <button
              onClick={handleToggleBinary}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                currentStatus === 'COMPLETED'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {currentStatus === 'COMPLETED' ? (
                <>
                  <Check size={12} /> Completat
                </>
              ) : (
                'Marcar completat'
              )}
            </button>
          </div>
        ) : (
          // Quantity / Duration / Counter / Value
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--text-secondary)] font-medium">
                Progrés: <span className="font-bold text-[var(--text-primary)]">{currentValue} / {habit.goalValue} {habit.unit}</span>
              </span>
              <span className={`font-bold ${currentStatus === 'COMPLETED' ? 'text-emerald-500' : 'text-brand-500'}`}>
                {((currentValue / habit.goalValue) * 100).toFixed(0)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${currentStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min((currentValue / habit.goalValue) * 100, 100)}%` }}
              />
            </div>

            {/* Quick adjust controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleQuantityChange(-Math.max(1, Math.round(habit.goalValue / 10)))}
                  className="w-7 h-7 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] rounded-lg flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                >
                  <Minus size={12} />
                </button>
                <button
                  onClick={() => handleQuantityChange(Math.max(1, Math.round(habit.goalValue / 10)))}
                  className="w-7 h-7 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] rounded-lg flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                >
                  <Plus size={12} />
                </button>
              </div>

              {currentStatus !== 'COMPLETED' && (
                <button
                  onClick={async () => {
                    await actions.logCheckIn(habit.id, date, 'COMPLETED', habit.goalValue, currentNotes);
                    toast.success('Hàbit completat! 🎉');
                  }}
                  className="px-2 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                >
                  Completa
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Note action and quick notes display */}
      <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)]/40 flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-[var(--text-muted)] truncate max-w-[170px]">
            {currentNotes ? `💬 ${currentNotes}` : 'Sense comentaris'}
          </span>
          <button
            onClick={() => {
              setNoteText(currentNotes);
              setShowNoteInput(!showNoteInput);
            }}
            className="text-brand-500 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare size={10} />
            {currentNotes ? 'Edita nota' : 'Afegeix nota'}
          </button>
        </div>

        {showNoteInput && (
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Nota ràpida..."
              className="flex-1 text-xs px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleSaveNote}
              className="px-2.5 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Ok
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
