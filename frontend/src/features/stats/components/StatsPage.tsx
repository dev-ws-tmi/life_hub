import { useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useSessionsStore } from '@/shared/stores/useSessionsStore';
import { useTasksStore } from '@/shared/stores/useTasksStore';
import { useSubjectsStore } from '@/shared/stores/useSubjectsStore';
import { formatDuration } from '@/shared/lib/utils';
import { Clock, CheckSquare, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// ── Tooltip personalitzat ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string}>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-[var(--text-primary)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[var(--text-secondary)]">
          {p.name}: <strong>{typeof p.value === 'number' && p.name.includes('h') ? `${p.value}h` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat Mini ─────────────────────────────────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-display font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      </div>
    </div>
  );
}

// ── Stats Page ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { sessions } = useSessionsStore();
  const { tasks } = useTasksStore();
  const { subjects } = useSubjectsStore();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  // ── Dades processades ─────────────────────────────────────────────────────
  const { dailyData, subjectData, taskData, timeVsGrade, totals } = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);

    const filteredSessions = sessions.filter((s) => new Date(s.startTime) >= cutoff);
    const filteredTasks = tasks.filter(
      (t) => t.status === 'COMPLETADA' && t.completedAt && new Date(t.completedAt) >= cutoff
    );

    // Dades diàries
    const dailyMap: Record<string, number> = {};
    filteredSessions.forEach((s) => {
      const day = new Date(s.startTime).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' });
      dailyMap[day] = (dailyMap[day] || 0) + s.durationMinutes;
    });

    const dailyData = Object.entries(dailyMap).map(([day, minutes]) => ({
      day,
      hores: Math.round((minutes / 60) * 10) / 10,
    })).slice(-Math.min(period, 14));

    // Per assignatura
    const subjectMap: Record<string, { name: string; color: string; minutes: number; tasks: number }> = {};
    filteredSessions.forEach((s) => {
      if (!s.subjectId) return;
      const subj = subjects.find((sub) => sub.id === s.subjectId);
      if (!subj) return;
      if (!subjectMap[s.subjectId]) {
        subjectMap[s.subjectId] = { name: subj.name, color: subj.color, minutes: 0, tasks: 0 };
      }
      subjectMap[s.subjectId].minutes += s.durationMinutes;
    });
    filteredTasks.forEach((t) => {
      if (!t.subjectId || !subjectMap[t.subjectId]) return;
      subjectMap[t.subjectId].tasks += 1;
    });

    const subjectData = Object.values(subjectMap).sort((a, b) => b.minutes - a.minutes);

    // Tasques per prioritat
    const priorityMap: Record<string, number> = { BAIXA: 0, NORMAL: 0, ALTA: 0, URGENT: 0 };
    filteredTasks.forEach((t) => { priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1; });

    const taskData = Object.entries(priorityMap).map(([name, value]) => ({
      name,
      value,
      color: { BAIXA: '#22c55e', NORMAL: '#3b82f6', ALTA: '#f97316', URGENT: '#ef4444' }[name] || '#6366f1',
    })).filter((d) => d.value > 0);

    const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalPomodoros = filteredSessions.filter((s) => s.type === 'POMODORO').length;
    const avgDailyMinutes = period > 0 ? totalMinutes / period : 0;
    const completedTasks = filteredTasks.length;

    // Càlcul de relació temps vs nota per assignatura
    const timeVsGrade = subjects.map((subj) => {
      const mins = sessions
        .filter((s) => s.subjectId === subj.id)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return {
        name: subj.name.slice(0, 12),
        hores: Math.round((mins / 60) * 10) / 10,
        nota: subj.currentGrade || 0,
      };
    });

    return {
      dailyData,
      subjectData,
      taskData,
      timeVsGrade,
      totals: { totalMinutes, totalPomodoros, avgDailyMinutes, completedTasks },
    };
  }, [sessions, tasks, subjects, period]);

  const hasData = sessions.length > 0 || tasks.some((t) => t.status === 'COMPLETADA');

  return (
    <div className="w-full space-y-6">
      {/* Capçalera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Estadístiques</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Analitza el teu rendiment i productivitat</p>
        </div>
        {/* Selector de període */}
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-xl p-1">
          {([7, 30, 90] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                period === p
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {p === 7 ? '7 dies' : p === 30 ? '30 dies' : '3 mesos'}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4 text-[var(--text-tertiary)]">
            <BarChart3 size={24} />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Sense dades suficients</h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-sm mx-auto">
            Inicia sessions Pomodoro i completa tasques per veure les teves estadístiques detallades aquí.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat icon={Clock}       label="Temps total" value={formatDuration(totals.totalMinutes)} color="#6366f1" />
            <MiniStat icon={TrendingUp}  label="Diària mitjana" value={formatDuration(Math.round(totals.avgDailyMinutes))} color="#8b5cf6" />
            <MiniStat icon={CheckSquare} label="Tasques completades" value={String(totals.completedTasks)} color="#22c55e" />
            <MiniStat icon={Calendar}    label="Pomodoros" value={String(totals.totalPomodoros)} color="#f97316" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activitat diària */}
            <div className="lg:col-span-2 card p-5">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Activitat diària (hores)</h3>
              {dailyData.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-10">Cap dada per al període seleccionat</p>
              ) : (
                <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
                  <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hores" name="Hores" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tasques per prioritat */}
            <div className="card p-5">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Tasques per prioritat</h3>
              {taskData.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-10">Cap tasca completada</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150} minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie data={taskData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {taskData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {taskData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[var(--text-secondary)]">{d.name}</span>
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Relació Temps vs Nota per Assignatura */}
          {subjects.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Relació Temps d'Estudi vs Nota Mitjana per Assignatura</h3>
              <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
                <BarChart data={timeVsGrade} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="hores" name="Hores d'estudi" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nota" name="Nota mitjana" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Hores per assignatura */}
          {subjectData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Temps per assignatura</h3>
              <div className="space-y-3">
                {subjectData.map((s) => {
                  const maxMinutes = subjectData[0].minutes;
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-medium text-[var(--text-secondary)] truncate flex-shrink-0">{s.name}</div>
                      <div className="flex-1 h-2.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(s.minutes / maxMinutes) * 100}%`, backgroundColor: s.color }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-primary)] w-12 text-right flex-shrink-0">
                        {formatDuration(s.minutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
