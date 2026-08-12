import { useMemo } from 'react';
import { useHabitsStore, calculateStreak } from '@/shared/stores/useHabitsStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Award, Flame, Calendar, CheckSquare, Clock } from 'lucide-react';
import { isHabitScheduled } from './HabitTodayList';

export default function HabitStats() {
  const { habits, logs, categories } = useHabitsStore();

  // 1. Calculate General Aggregates
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const scheduledToday = habits.filter(h => isHabitScheduled(h, todayStr));
    const todayLogs = logs.filter(l => l.date === todayStr);
    const completedToday = todayLogs.filter(l => l.status === 'COMPLETED').length;

    // Streaks
    let activeBestStreak = 0;
    let longestBestStreak = 0;

    habits.forEach(h => {
      const streak = calculateStreak(logs, h.id);
      if (streak.current > activeBestStreak) activeBestStreak = streak.current;
      if (streak.longest > longestBestStreak) longestBestStreak = streak.longest;
    });

    // Global Compliance percentage in the last 30 days
    const last30Days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last30Days.push(d.toISOString().split('T')[0]);
    }

    let totalScheduledCount = 0;
    let totalCompletedCount = 0;

    last30Days.forEach(dateStr => {
      const scheduled = habits.filter(h => isHabitScheduled(h, dateStr));
      const dayLogs = logs.filter(l => l.date === dateStr);
      const completed = dayLogs.filter(l => l.status === 'COMPLETED').length;

      totalScheduledCount += scheduled.length;
      totalCompletedCount += completed;
    });

    const compliance30d = totalScheduledCount > 0 ? (totalCompletedCount / totalScheduledCount) * 100 : 0;

    return {
      scheduledTodayCount: scheduledToday.length,
      completedTodayCount: completedToday,
      activeBestStreak,
      longestBestStreak,
      compliance30d,
    };
  }, [habits, logs]);

  // 2. Weekly Progress Trend Data (last 7 days)
  const weeklyTrendData = useMemo(() => {
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const scheduled = habits.filter(h => isHabitScheduled(h, dateStr));
      const dayLogs = logs.filter(l => l.date === dateStr);
      const completed = dayLogs.filter(l => l.status === 'COMPLETED').length;

      const rate = scheduled.length > 0 ? Math.round((completed / scheduled.length) * 100) : 0;

      result.push({
        dayName: d.toLocaleDateString('ca-ES', { weekday: 'short' }),
        Compliment: rate,
      });
    }

    return result;
  }, [habits, logs]);

  // 3. Category distribution data
  const categoryComplianceData = useMemo(() => {
    const catMap: Record<string, { total: number; completed: number; name: string; color: string }> = {};

    categories.forEach(c => {
      catMap[c.id] = { total: 0, completed: 0, name: c.name, color: c.color };
    });

    // Check last 30 days logs
    const today = new Date();
    const last30Days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last30Days.push(d.toISOString().split('T')[0]);
    }

    last30Days.forEach(dateStr => {
      habits.forEach(h => {
        if (isHabitScheduled(h, dateStr)) {
          if (catMap[h.categoryId]) {
            catMap[h.categoryId].total++;
            const logId = `${h.id}_${dateStr}`;
            const log = logs.find(l => l.id === logId);
            if (log?.status === 'COMPLETED') {
              catMap[h.categoryId].completed++;
            }
          }
        }
      });
    });

    return Object.values(catMap)
      .filter(item => item.total > 0)
      .map(item => ({
        name: item.name,
        Compliment: Math.round((item.completed / item.total) * 100),
        color: item.color,
      }));
  }, [habits, logs, categories]);

  return (
    <div className="space-y-6">
      {/* 30 Day overview metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Compliance Avui */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Compliment d'Avui</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.scheduledTodayCount > 0 ? `${stats.completedTodayCount} / ${stats.scheduledTodayCount}` : '0 / 0'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Hàbits realitzats avui</p>
          </div>
        </div>

        {/* Global 30d Compliance */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Percentatge 30 dies</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-emerald-500">
              {stats.compliance30d.toFixed(0)}%
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Taxa mitjana de compliment</p>
          </div>
        </div>

        {/* Best Current Streak */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Millor Ratxa Activa</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-500">
              {stats.activeBestStreak} dies
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Més consecutius actius</p>
          </div>
        </div>

        {/* Longest Streak Overall */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Rècord de Ratxa</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-purple-500">
              {stats.longestBestStreak} dies
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Històric de dies consecutius</p>
          </div>
        </div>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Trend Line Chart */}
        <div className="card p-5 space-y-4">
          <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Calendar size={16} className="text-brand-500" /> Progrés dels últims 7 dies
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="dayName" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px'
                  }}
                />
                <Line type="monotone" dataKey="Compliment" stroke="var(--color-brand-500)" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="card p-5 space-y-4">
          <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Clock size={16} className="text-brand-500" /> Rendiment per Categories (30 dies)
          </h4>
          <div className="h-64">
            {categoryComplianceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No hi ha prou dades per categoritzar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryComplianceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-raised)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="Compliment" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
