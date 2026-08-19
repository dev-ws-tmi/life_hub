import { useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';
import { useHealthStore } from '@/shared/stores/useHealthStore';
import { Dumbbell, Scale, TrendingUp } from 'lucide-react';

export default function HealthStats() {
  const { workouts, weightEntries, weightTargetKg } = useHealthStore();

  // 1. Weight Evolution Chart Data
  const weightChartData = useMemo(() => {
    return weightEntries.map((w) => ({
      date: new Date(w.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' }),
      'Pes (kg)': w.weightKg,
      'Objectiu (kg)': weightTargetKg,
    }));
  }, [weightEntries, weightTargetKg]);

  // 2. Workout Activity (Duration & Calories)
  const workoutChartData = useMemo(() => {
    const workoutsMap: Record<string, { duration: number; calories: number; dateStr: string }> = {};

    // Last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      workoutsMap[dateStr] = {
        duration: 0,
        calories: 0,
        dateStr: d.toLocaleDateString('ca-ES', { weekday: 'short' }),
      };
    }

    workouts.forEach((w) => {
      if (workoutsMap[w.date]) {
        workoutsMap[w.date].duration += w.durationMinutes;
        workoutsMap[w.date].calories += w.caloriesBurned || 0;
      }
    });

    return Object.values(workoutsMap).map((item) => ({
      day: item.dateStr,
      'Minuts d\'Exercici': item.duration,
      'Calories (kcal)': item.calories,
    }));
  }, [workouts]);

  // Totals for metric cards
  const totalWorkoutMinutes7d = useMemo(() => {
    return workoutChartData.reduce((sum, d) => sum + d['Minuts d\'Exercici'], 0);
  }, [workoutChartData]);

  const totalCalories7d = useMemo(() => {
    return workoutChartData.reduce((sum, d) => sum + d['Calories (kcal)'], 0);
  }, [workoutChartData]);

  return (
    <div className="space-y-6">
      
      {/* 2 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Exercici (Últims 7 dies)</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Dumbbell size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalWorkoutMinutes7d} minuts</p>
          <p className="text-[10px] text-[var(--text-secondary)]">~{totalCalories7d} kcal cremades aproximadament</p>
        </div>

        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Tendència de Pes</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Scale size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-500">
            {weightEntries.length > 0 ? `${weightEntries[weightEntries.length - 1].weightKg} kg` : '—'}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">Objectiu establert: {weightTargetKg} kg</p>
        </div>

      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weight Evolution Chart */}
        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" /> Evolució del Pes corporal (kg)
            </h4>
          </div>
          <div className="h-64">
            {weightChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No s'ha enregistrat cap pes encara.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 250 }}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-raised)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="Pes (kg)" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Objectiu (kg)" stroke="var(--text-muted)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workout Activity Bar Chart */}
        <div className="card p-5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Dumbbell size={16} className="text-brand-500" /> Minuts d'Entrenament (7 Dies)
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 250 }}>
              <BarChart data={workoutChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="Minuts d'Exercici" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
