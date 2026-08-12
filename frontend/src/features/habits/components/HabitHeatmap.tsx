import { useMemo } from 'react';
import { useHabitsStore } from '@/shared/stores/useHabitsStore';
import { isHabitScheduled } from './HabitTodayList';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function HabitHeatmap() {
  const { habits, logs } = useHabitsStore();

  // 1. Calculate compliance for each of the last 365 days
  const heatmapData = useMemo(() => {
    const today = new Date();
    const result: { dateStr: string; dayOfWeek: number; compliance: number; level: 0 | 1 | 2 | 3 }[] = [];

    // Go back 365 days (plus enough days to start on a Monday)
    const startDate = new Date();
    startDate.setDate(today.getDate() - 365);
    
    // Align with Monday
    const startDay = startDate.getDay(); // 0 is Sun, 1 is Mon
    const daysToSubtract = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Group logs by date for fast lookup
    const logsByDateMap: Record<string, typeof logs> = {};
    logs.forEach(l => {
      if (!logsByDateMap[l.date]) {
        logsByDateMap[l.date] = [];
      }
      logsByDateMap[l.date].push(l);
    });

    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Find active habits scheduled for this day
      const scheduled = habits.filter(h => isHabitScheduled(h, dateStr));
      const dayLogs = logsByDateMap[dateStr] || [];

      const completedCount = dayLogs.filter(l => l.status === 'COMPLETED').length;

      let compliance = 0;
      let level: 0 | 1 | 2 | 3 = 0;

      if (scheduled.length > 0) {
        compliance = completedCount / scheduled.length;
        if (compliance === 0) level = 0;
        else if (compliance <= 0.35) level = 1;
        else if (compliance <= 0.7) level = 2;
        else level = 3;
      }

      result.push({
        dateStr,
        dayOfWeek: dayOfWeek === 0 ? 6 : dayOfWeek - 1, // normalize to 0=Mon, 6=Sun
        compliance,
        level,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }, [habits, logs]);

  // 2. Chunk days into weeks
  const weeks = useMemo(() => {
    const chunked: typeof heatmapData[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      chunked.push(heatmapData.slice(i, i + 7));
    }
    return chunked;
  }, [heatmapData]);

  // 3. Level color mapper using primary CSS oklch variables
  const getCellClass = (level: 0 | 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return 'bg-brand-500/30 hover:ring-1 hover:ring-brand-500/50';
      case 2:
        return 'bg-brand-500/60 hover:ring-1 hover:ring-brand-500/80';
      case 3:
        return 'bg-brand-500 hover:ring-1 hover:ring-brand-500';
      case 0:
      default:
        return 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]/40 hover:border-[var(--border-default)]';
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
            <CalendarIcon size={16} className="text-brand-500" /> Calendari de Compliment Anual
          </h4>
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Constància d'hàbits diaris de l'últim any</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--text-secondary)]">
          <span>Menys</span>
          <div className="w-2.5 h-2.5 rounded-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
          <div className="w-2.5 h-2.5 rounded-xs bg-brand-500/30" />
          <div className="w-2.5 h-2.5 rounded-xs bg-brand-500/60" />
          <div className="w-2.5 h-2.5 rounded-xs bg-brand-500" />
          <span>Més</span>
        </div>
      </div>

      {/* Grid container with horizontal scrolling */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-1 min-w-[720px] select-none py-1">
          {/* Weekday labels */}
          <div className="flex flex-col justify-between text-[9px] font-semibold text-[var(--text-muted)] pr-2 py-0.5 select-none w-6 h-24">
            <span>Dl</span>
            <span>Dc</span>
            <span>Dv</span>
            <span>Dg</span>
          </div>

          {/* Grid weeks */}
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1 w-3">
              {week.map((day) => (
                <div
                  key={day.dateStr}
                  title={`${day.dateStr}: ${(day.compliance * 100).toFixed(0)}% compliment`}
                  className={`w-3 h-3 rounded-[3px] transition-all cursor-pointer ${getCellClass(day.level)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
