import { useState, useMemo } from 'react';
import { useHabitsStore, type Habit } from '@/shared/stores/useHabitsStore';
import HabitCard from './HabitCard';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function isHabitScheduled(habit: Habit, dateStr: string): boolean {
  if (habit.isArchived || habit.isPaused) return false;
  if (dateStr < habit.startDate) return false;
  if (habit.endDate && dateStr > habit.endDate) return false;

  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)

  switch (habit.frequency) {
    case 'DAILY':
      return true;
    case 'WORKDAYS':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'WEEKENDS':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'SPECIFIC_DAYS':
      return habit.daysOfWeek.includes(dayOfWeek);
    case 'INTERVAL':
      if (!habit.frequencyInterval) return true;
      const start = new Date(habit.startDate);
      const diffTime = date.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % habit.frequencyInterval === 0;
    default:
      return true;
  }
}

export default function HabitTodayList() {
  const { habits } = useHabitsStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Navigate dates
  const handleDateChange = (daysOffset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + daysOffset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = useMemo(() => {
    return selectedDate === new Date().toISOString().split('T')[0];
  }, [selectedDate]);

  const scheduledHabits = useMemo(() => {
    return habits
      .filter(h => isHabitScheduled(h, selectedDate))
      .sort((a, b) => a.order - b.order);
  }, [habits, selectedDate]);

  const formattedDate = useMemo(() => {
    const d = new Date(selectedDate);
    return d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Date navigation header */}
      <div className="flex items-center justify-between bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-sm">
        <button
          onClick={() => handleDateChange(-1)}
          className="p-1.5 hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-brand-500" />
          <span className="text-xs font-bold text-[var(--text-primary)] capitalize">
            {isToday ? `Avui, ${formattedDate}` : formattedDate}
          </span>
        </div>

        <button
          onClick={() => handleDateChange(1)}
          className="p-1.5 hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid of habits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduledHabits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} date={selectedDate} />
        ))}
      </div>

      {scheduledHabits.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-2">
          <p className="text-xs text-[var(--text-muted)] font-semibold">No tens cap hàbit planificat per a aquest dia.</p>
          <p className="text-[10px] text-[var(--text-secondary)]">Crea un nou hàbit o selecciona un altre dia.</p>
        </div>
      )}
    </div>
  );
}
