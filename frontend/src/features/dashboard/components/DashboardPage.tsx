import { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  CheckSquare, Clock, Calendar, AlertCircle, Award, Wallet, PiggyBank, Tv, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSubjectsStore } from '@/shared/stores/useSubjectsStore';
import { useTasksStore } from '@/shared/stores/useTasksStore';
import { useSessionsStore } from '@/shared/stores/useSessionsStore';
import { useFinancesStore } from '@/shared/stores/useFinancesStore';
import { useHabitsStore } from '@/shared/stores/useHabitsStore';
import { useHabitsActions } from '@/features/habits/hooks/useHabitsActions';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

type TimeScope = 'AVUI' | 'SETMANA' | 'MES' | 'ANY';

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const { subjects } = useSubjectsStore();
  const { tasks } = useTasksStore();
  const { sessions } = useSessionsStore();

  const { timeScope } = useOutletContext<{ timeScope: TimeScope }>();

  const now = new Date();

  // ── 1.5 CÀLCULS DE FINANCES (LIFE HUB) ───────────────────────────────────────
  const { accounts, subscriptions, goals, budgets } = useFinancesStore();

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const nextSubscription = useMemo(() => {
    const active = subscriptions.filter(s => s.isActive);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))[0];
  }, [subscriptions]);

  const mainGoal = useMemo(() => {
    if (goals.length === 0) return null;
    return [...goals].sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0];
  }, [goals]);

  const currentBudgetProgress = useMemo(() => {
    const cMonth = now.getMonth() + 1;
    const cYear = now.getFullYear();
    const active = budgets.filter(b => b.month === cMonth && b.year === cYear);
    if (active.length === 0) return null;
    const limit = active.reduce((sum, b) => sum + b.amount, 0);
    const spent = active.reduce((sum, b) => sum + b.spent, 0);
    return { limit, spent, pct: limit > 0 ? (spent / limit) * 100 : 0 };
  }, [budgets]);

  // ── 1.7 CÀLCULS D'HÀBITS (LIFE HUB) ──────────────────────────────────────────
  const { habits, logs } = useHabitsStore();
  const habitActions = useHabitsActions();
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const scheduledToday = useMemo(() => {
    return habits.filter(h => {
      if (h.isArchived || h.isPaused) return false;
      if (todayStr < h.startDate) return false;
      if (h.endDate && todayStr > h.endDate) return false;

      const date = new Date(todayStr);
      const dayOfWeek = date.getDay();

      switch (h.frequency) {
        case 'DAILY':
          return true;
        case 'WORKDAYS':
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'WEEKENDS':
          return dayOfWeek === 0 || dayOfWeek === 6;
        case 'SPECIFIC_DAYS':
          return h.daysOfWeek?.includes(dayOfWeek);
        case 'INTERVAL':
          if (!h.frequencyInterval) return true;
          const start = new Date(h.startDate);
          const diffTime = date.getTime() - start.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays % h.frequencyInterval === 0;
        default:
          return true;
      }
    });
  }, [habits, todayStr]);

  const completedTodayCount = useMemo(() => {
    return logs.filter(l => l.date === todayStr && l.status === 'COMPLETED').length;
  }, [logs, todayStr]);

  const complianceRate = useMemo(() => {
    if (scheduledToday.length === 0) return 0;
    return (completedTodayCount / scheduledToday.length) * 100;
  }, [scheduledToday, completedTodayCount]);

  // ── 2. CÀLCULS ACADÈMICS ────────────────────────────────────────────────────
  const exams = useMemo(() => {
    return subjects.flatMap(s => 
      (s.topics || []).flatMap(t => 
        (t.activities || []).filter(a => a.type === 'EXAMEN')
      )
    );
  }, [subjects]);

  const statsSummary = useMemo(() => {
    const filterByScope = (dateStr?: string | Date) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const diffTime = now.getTime() - d.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeScope === 'AVUI') {
        return d.toDateString() === now.toDateString();
      }
      if (timeScope === 'SETMANA') {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (timeScope === 'MES') {
        return diffDays >= 0 && diffDays <= 30;
      }
      if (timeScope === 'ANY') {
        return diffDays >= 0 && diffDays <= 365;
      }
      return true;
    };

    // 1. Mitjana acadèmica
    const gradedActivities = subjects.flatMap(s => 
      (s.topics || []).flatMap(t => 
        (t.activities || []).filter(a => a.completed && a.grade !== undefined && filterByScope(a.date))
      )
    );
    const fallbackGraded = subjects.flatMap(s => 
      (s.topics || []).flatMap(t => 
        (t.activities || []).filter(a => a.completed && a.grade !== undefined)
      )
    );
    const useGraded = gradedActivities.length > 0 ? gradedActivities : fallbackGraded;
    const sumGrades = useGraded.reduce((sum, a) => sum + (a.grade ?? 0), 0);
    const average = useGraded.length > 0 ? (sumGrades / useGraded.length).toFixed(2) : '—';

    // 2. Tasques totals
    const pendingTasks = tasks.filter(t => t.status === 'PENDENT' || t.status === 'EN_PROGRES').length;
    const completedInPeriod = tasks.filter(
      (t) => t.completedAt && filterByScope(t.completedAt)
    ).length;

    // 3. Estudi hores
    const periodMinutes = sessions
      .filter((s) => filterByScope(s.startTime))
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    const studyHours = Math.round((periodMinutes / 60) * 10) / 10;
    
    let studyObjective = 20;
    let periodLabel = 'aquesta setmana';
    let completedLabel = `${completedInPeriod} completades avui`;
    if (timeScope === 'AVUI') {
      studyObjective = Math.round((20 / 7) * 10) / 10;
      periodLabel = 'avui';
      completedLabel = `${completedInPeriod} completades avui`;
    } else if (timeScope === 'SETMANA') {
      studyObjective = userProfile?.weeklyObjective || 20;
      periodLabel = 'setmana';
      completedLabel = `${completedInPeriod} completades aquesta setmana`;
    } else if (timeScope === 'MES') {
      studyObjective = (userProfile?.weeklyObjective || 20) * 4;
      periodLabel = 'mes';
      completedLabel = `${completedInPeriod} completades aquest mes`;
    } else if (timeScope === 'ANY') {
      studyObjective = (userProfile?.weeklyObjective || 20) * 52;
      periodLabel = 'any';
      completedLabel = `${completedInPeriod} completades aquest any`;
    }

    // 4. Exàmens pendents
    const pendingExams = exams.filter(e => !e.completed).length;
    const upcomingExamsCount = exams.filter(e => {
      if (e.completed || !e.date) return false;
      return filterByScope(e.date);
    }).length;

    return { 
      average, 
      pendingTasks, 
      completedLabel, 
      studyHours, 
      studyObjective, 
      periodLabel, 
      pendingExams, 
      upcomingExamsCount 
    };
  }, [exams, subjects, tasks, sessions, timeScope, userProfile]);

  // ── 3. DADES PER AL GRÀFIC GENERAL ──────────────────────────────────────────
  const chartData = useMemo(() => {
    const currentYear = now.getFullYear();

    if (timeScope === 'AVUI') {
      const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      return hours.map((h, index) => {
        const startHour = index * 2;
        const endHour = startHour + 2;

        const created = tasks.filter(t => {
          const d = new Date(t.createdAt);
          return d.toDateString() === now.toDateString() && d.getHours() >= startHour && d.getHours() < endHour;
        }).length;

        const finished = tasks.filter(t => {
          if (!t.completedAt) return false;
          const d = new Date(t.completedAt);
          return d.toDateString() === now.toDateString() && d.getHours() >= startHour && d.getHours() < endHour;
        }).length;

        const studyMinutes = sessions.filter(s => {
          const d = new Date(s.startTime);
          return d.toDateString() === now.toDateString() && d.getHours() >= startHour && d.getHours() < endHour;
        }).reduce((sum, s) => sum + s.durationMinutes, 0);

        return {
          name: h,
          'Tasques Creades': created,
          'Hores d\'Estudi': Math.round((studyMinutes / 60) * 10) / 10,
          'Tasques Completades': finished
        };
      });
    }

    if (timeScope === 'SETMANA') {
      const days = ['Dll', 'Dmt', 'Dmc', 'Djs', 'Div', 'Dss', 'Diu'];
      const currentDayOfWeek = now.getDay();

      return days.map((dayName, index) => {
        const targetDayIndex = index === 6 ? 0 : index + 1;
        const diffDays = targetDayIndex - currentDayOfWeek;
        const targetDate = new Date(now.getTime() + diffDays * 24 * 60 * 60 * 1000);

        const created = tasks.filter(t => {
          const d = new Date(t.createdAt);
          return d.toDateString() === targetDate.toDateString();
        }).length;

        const finished = tasks.filter(t => {
          if (!t.completedAt) return false;
          const d = new Date(t.completedAt);
          return d.toDateString() === targetDate.toDateString();
        }).length;

        const studyMinutes = sessions.filter(s => {
          const d = new Date(s.startTime);
          return d.toDateString() === targetDate.toDateString();
        }).reduce((sum, s) => sum + s.durationMinutes, 0);

        return {
          name: dayName,
          'Tasques Creades': created,
          'Hores d\'Estudi': Math.round((studyMinutes / 60) * 10) / 10,
          'Tasques Completades': finished
        };
      });
    }

    if (timeScope === 'MES') {
      const weeks = ['Setm 1', 'Setm 2', 'Setm 3', 'Setm 4'];
      return weeks.map((w, index) => {
        const startDay = index * 7 + 1;
        const endDay = startDay + 7;

        const created = tasks.filter(t => {
          const d = new Date(t.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === currentYear && d.getDate() >= startDay && d.getDate() < endDay;
        }).length;

        const finished = tasks.filter(t => {
          if (!t.completedAt) return false;
          const d = new Date(t.completedAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === currentYear && d.getDate() >= startDay && d.getDate() < endDay;
        }).length;

        const studyMinutes = sessions.filter(s => {
          const d = new Date(s.startTime);
          return d.getMonth() === now.getMonth() && d.getFullYear() === currentYear && d.getDate() >= startDay && d.getDate() < endDay;
        }).reduce((sum, s) => sum + s.durationMinutes, 0);

        return {
          name: w,
          'Tasques Creades': created,
          'Hores d\'Estudi': Math.round((studyMinutes / 60) * 10) / 10,
          'Tasques Completades': finished
        };
      });
    }

    const months = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
    return months.map((m, index) => {
      const created = tasks.filter(t => {
        const d = new Date(t.createdAt);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      }).length;

      const finished = tasks.filter(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      }).length;

      const studyMinutes = sessions.filter(s => {
        const d = new Date(s.startTime);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      }).reduce((sum, s) => sum + s.durationMinutes, 0);

      const studyHours = Math.round((studyMinutes / 60) * 10) / 10;

      return {
        name: m,
        'Tasques Creades': created,
        'Hores d\'Estudi': studyHours,
        'Tasques Completades': finished
      };
    });
  }, [tasks, sessions, timeScope]);

  // ── 4. ACTIVITAT RECENT (Llista simplificada) ────────────────────────────────
  const recentActivities = useMemo(() => {
    const list: Array<{ id: string; title: string; time: Date; type: string }> = [];

    tasks.forEach(t => {
      list.push({
        id: `t-created-${t.id}`,
        title: `Creada: "${t.title}"`,
        time: new Date(t.createdAt),
        type: 'tasca'
      });
      if (t.completedAt) {
        list.push({
          id: `t-comp-${t.id}`,
          title: `Completada: "${t.title}"`,
          time: new Date(t.completedAt),
          type: 'completat'
        });
      }
    });

    sessions.forEach(s => {
      const subName = subjects.find(sub => sub.id === s.subjectId)?.name || 'Estudi';
      list.push({
        id: s.id,
        title: `Pomodoro de ${s.durationMinutes}m a ${subName}`,
        time: new Date(s.startTime),
        type: 'estudi'
      });
    });

    return list
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  }, [tasks, sessions, subjects]);

  // ── 5. DADES PER ELS GRÀFICS DE FORMATGE ────────────────────────────────────
  const tasksBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.status === 'ARXIVADA') return;
      const subName = subjects.find(s => s.id === t.subjectId)?.name || 'Sense matèria';
      counts[subName] = (counts[subName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks, subjects]);

  const tasksByPriority = useMemo(() => {
    const counts: Record<string, number> = { BAIXA: 0, NORMAL: 0, ALTA: 0, URGENT: 0 };
    tasks.forEach(t => {
      if (t.status === 'ARXIVADA') return;
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    const counts: Record<string, number> = { PENDENT: 0, EN_PROGRES: 0, COMPLETADA: 0 };
    tasks.forEach(t => {
      if (t.status === 'ARXIVADA') return;
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const donutColors = ['var(--color-brand-500)', 'var(--color-accent-violet)', 'var(--color-accent-emerald)', 'var(--color-accent-amber)', 'var(--color-accent-pink)'];

  return (
    <div className="space-y-6 w-full animate-fade-in py-2">

      {/* 4 CARDS DE STATS SIMÈTRIQUES I PREMIUM (Cantonades rounded-xl) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Mitjana Acadèmica */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Mitjana Acadèmica</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)]">{statsSummary.average}</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Qualificació mitjana sobre 10</p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: statsSummary.average !== '—' ? `${parseFloat(statsSummary.average) * 10}%` : '0%' }}
            />
          </div>
        </div>

        {/* Card 2: Tasques Actives */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Tasques Pendents</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)]">{statsSummary.pendingTasks}</h3>
            <p className="text-[10px] text-[var(--text-muted)]">{statsSummary.completedLabel}</p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full w-2/3" />
          </div>
        </div>

        {/* Card 3: Temps d'Estudi */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Temps d'Estudi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)]">
              {statsSummary.studyHours}h
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">Objectiu: {statsSummary.studyObjective}h ({statsSummary.periodLabel})</p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((statsSummary.studyHours / statsSummary.studyObjective) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Propers Exàmens */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Propers Exàmens</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)]">{statsSummary.pendingExams}</h3>
            <p className="text-[10px] text-[var(--text-muted)]">{statsSummary.upcomingExamsCount} en el període</p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
              style={{ width: statsSummary.upcomingExamsCount > 0 ? '80%' : '20%' }}
            />
          </div>
        </div>

      </div>

      {/* SECCIÓ LIFE HUB: STATS DE FINANCES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Saldo Consolidat */}
        <Link to="/finances" className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:translate-y-[-1px] hover:border-[var(--border-default)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Saldo Consolidat</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)]">
              {totalBalance.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">Total entre tots els comptes</p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden" />
        </Link>

        {/* Card 2: Proper Rebut */}
        <Link to="/finances" className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:translate-y-[-1px] hover:border-[var(--border-default)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Proper Rebut</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <Tv size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)] truncate">
              {nextSubscription ? `${nextSubscription.cost.toFixed(2)}€` : 'Cap rebut'}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] truncate">
              {nextSubscription ? `${nextSubscription.name} · ${nextSubscription.nextBillingDate}` : 'Sense subscripcions actives'}
            </p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden" />
        </Link>

        {/* Card 3: Objectiu d'Estalvi */}
        <Link to="/finances" className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:translate-y-[-1px] hover:border-[var(--border-default)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Objectiu d'Estalvi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <PiggyBank size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)] truncate">
              {mainGoal ? `${mainGoal.currentAmount}€ / ${mainGoal.targetAmount}€` : 'Cap objectiu'}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] truncate">
              {mainGoal ? mainGoal.name : 'Estableix metes d\'estalvi'}
            </p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            {mainGoal && (
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((mainGoal.currentAmount / mainGoal.targetAmount) * 100, 100)}%` }}
              />
            )}
          </div>
        </Link>

        {/* Card 4: Pressupost Mensual */}
        <Link to="/finances" className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:translate-y-[-1px] hover:border-[var(--border-default)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Pressupost Mensual</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <RefreshCw size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)] truncate">
              {currentBudgetProgress ? `${currentBudgetProgress.spent.toFixed(0)}€ / ${currentBudgetProgress.limit.toFixed(0)}€` : 'Sense límit'}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">
              {currentBudgetProgress ? `${currentBudgetProgress.pct.toFixed(0)}% consumit aquest mes` : 'Estableix límits mensuals'}
            </p>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            {currentBudgetProgress && (
              <div 
                className={`h-full rounded-full transition-all duration-500 ${currentBudgetProgress.pct >= 100 ? 'bg-red-500' : 'bg-amber-500'}`} 
                style={{ width: `${Math.min(currentBudgetProgress.pct, 100)}%` }}
              />
            )}
          </div>
        </Link>

      </div>

      {/* SECCIÓ HÀBITS: RÀPID CONTROL DE RUTINES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Llista d'hàbits actius d'avui */}
        <div className="lg:col-span-2 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Hàbits i Rutines d'Avui</h3>
              <p className="text-[10px] text-[var(--text-secondary)]">Registra el teu progrés diari amb un sol clic</p>
            </div>
            <Link to="/habits" className="text-xs text-brand-500 font-bold hover:underline">Veure tot</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
            {scheduledToday.map(h => {
              const logId = `${h.id}_${todayStr}`;
              const log = logs.find(l => l.id === logId);
              const isDone = log?.status === 'COMPLETED';

              return (
                <div 
                  key={h.id} 
                  onClick={async () => {
                    const nextStatus = isDone ? 'FAILED' : 'COMPLETED';
                    await habitActions.logCheckIn(h.id, todayStr, nextStatus, nextStatus === 'COMPLETED' ? h.goalValue : 0);
                  }}
                  className={`p-3 bg-[var(--bg-elevated)] border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-[var(--bg-raised)] ${
                    isDone ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-[var(--bg-elevated)] to-transparent' : 'border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                    <span className={`text-xs font-semibold truncate ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                      {h.title}
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-subtle)] text-transparent'
                  }`}>
                    <CheckSquare size={12} className="stroke-[3]" />
                  </div>
                </div>
              );
            })}
            {scheduledToday.length === 0 && (
              <p className="col-span-2 text-xs text-[var(--text-muted)] text-center py-6">No tens cap hàbit planificat per a avui.</p>
            )}
          </div>
        </div>

        {/* Progress Ring / Streak overview */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-[var(--border-subtle)] pb-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Progrés Global d'Avui</h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Percentatge d'èxit de les teves rutines</p>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            <span className={`text-3xl font-display font-bold ${complianceRate >= 80 ? 'text-emerald-500' : 'text-brand-500'}`}>
              {complianceRate.toFixed(0)}%
            </span>
            <p className="text-[9px] text-[var(--text-muted)] mt-1">{completedTodayCount} de {scheduledToday.length} hàbits completats</p>
          </div>

          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${complianceRate >= 80 ? 'bg-emerald-500' : 'bg-brand-500'}`}
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </div>

      </div>

      {/* SECCIÓ CENTRAL: CHART D'ACTIVITAT + LOG RECENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gràfic d'activitat temporal */}
        <div className="lg:col-span-2 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Activitat Temporal i Rendiment</h3>
              <p className="text-[10px] text-[var(--text-secondary)]">Hores d'estudi i gestió de tasques</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-secondary)]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <span>Estudi (h)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Fetes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" style={{ opacity: 0.7 }} />
                <span>Creades</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 500, height: 250 }}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEstudi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Hores d'Estudi"
                  stroke="var(--color-brand-500)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEstudi)"
                />
                <Area
                  type="monotone"
                  dataKey="Tasques Completades"
                  stroke="var(--color-accent-emerald)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Area
                  type="monotone"
                  dataKey="Tasques Creades"
                  stroke="var(--color-accent-amber)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Log d'activitat recent */}
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-[var(--border-subtle)] pb-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Activitat Recent</h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Darrers registres de l'aplicació</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1 max-h-[210px]">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)] text-xs">
                <AlertCircle size={20} className="mb-1.5" />
                <span>Cap activitat encara</span>
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] border-b border-[var(--border-subtle)]/30 pb-2.5 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                    ${act.type === 'estudi' ? 'bg-brand-500' : act.type === 'completat' ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight truncate">{act.title}</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                      {act.time.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' })}{' '}
                      {act.time.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* SECCIÓ INFERIOR: DONUT CHARTS (SENSE DADES MINIMALISTA PLACEHOLDERS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <DonutCard
          data={tasksBySubject}
          title="Tasques per Assignatura"
          colors={donutColors}
        />

        <DonutCard
          data={tasksByPriority}
          title="Tasques per Prioritat"
          colors={['var(--color-accent-emerald)', 'var(--color-brand-500)', 'var(--color-accent-amber)', 'var(--color-accent-pink)']}
        />

        <DonutCard
          data={tasksByStatus}
          title="Tasques per Estat"
          colors={['var(--color-accent-amber)', 'var(--color-brand-500)', 'var(--color-accent-emerald)']}
        />

      </div>

    </div>
  );
}

// ── COMPONENT INTERN DE FORMATGE / DONUT (Cantonades rounded-xl) ─────────────────
function DonutCard({
  data, title, colors
}: {
  data: { name: string; value: number }[];
  title: string;
  colors: string[];
}) {
  const hasData = useMemo(() => {
    return data.length > 0 && data.some(d => d.value > 0);
  }, [data]);

  return (
    <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm flex flex-col items-center">
      <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 self-start">{title}</h4>
      
      <div className="h-32 w-full flex items-center justify-center relative select-none">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 120, height: 120 }}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={38}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  fontSize: '10px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {/* Donut gris de placeholder amb cantonades estilitzades */}
            <div className="w-24 h-24 rounded-full border-[10px] border-zinc-150 dark:border-zinc-800 flex items-center justify-center" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold mt-2">Sense dades</span>
          </div>
        )}
      </div>

      {/* Llegenda en format graella */}
      {hasData && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-3 text-[10px] font-bold text-[var(--text-secondary)]">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="truncate max-w-[100px]">{d.name}</span>
              <span className="text-[var(--text-muted)]">({d.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
