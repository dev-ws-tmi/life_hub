import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  CheckSquare
} from 'lucide-react';
import { useSubjectsStore } from '@/shared/stores/useSubjectsStore';
import { useTasksStore, type Task, type TaskPriority } from '@/shared/stores/useTasksStore';
import { useSessionsStore, type StudySession } from '@/shared/stores/useSessionsStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn, formatDuration, formatDate } from '@/shared/lib/utils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MONTH_NAMES = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Dembre'
];

const WEEKDAYS = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subjects } = useSubjectsStore();
  const { tasks, addTask, completeTask } = useTasksStore();
  const { sessions } = useSessionsStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'ALL' | 'TASKS' | 'SESSIONS'>('ALL');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskSubject, setQuickTaskSubject] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<TaskPriority>('NORMAL');

  // Any i mes actuals
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Canviar de mes
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Generar dies de la quadrícula del calendari (estil dilluns a diumenge)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajustar diumenge = 6, dilluns = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Diumenge

    const totalDays = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Dies del mes anterior (padding)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Dies del mes actual
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Dies del mes següent per completar la setmana (múltiple de 7, normalment 42 cel·les)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  // Formatar una data com a clau per a cerques fàcils (YYYY-MM-DD)
  const getDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Agrupar tasques i sessions per data
  const eventsByDate = useMemo(() => {
    const groups: Record<string, { tasks: Task[]; sessions: StudySession[] }> = {};

    // Mapejar tasques actives
    tasks.forEach((task) => {
      if (task.dueDate && task.status !== 'ARXIVADA') {
        const key = task.dueDate.split('T')[0];
        if (!groups[key]) groups[key] = { tasks: [], sessions: [] };
        groups[key].tasks.push(task);
      }
    });

    // Mapejar sessions d'estudi
    sessions.forEach((session) => {
      const key = session.startTime.split('T')[0];
      if (!groups[key]) groups[key] = { tasks: [], sessions: [] };
      groups[key].sessions.push(session);
    });

    return groups;
  }, [tasks, sessions]);

  // Determinar si una data és avui
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Determinar si una data és la seleccionada
  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Esdeveniments del dia seleccionat
  const selectedDateKey = getDateKey(selectedDate);
  const selectedDayEvents = eventsByDate[selectedDateKey] || { tasks: [], sessions: [] };

  // Crear tasca ràpida pel dia seleccionat
  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    // Crear la data amb l'hora final del dia seleccionat
    const dueDate = new Date(selectedDate);
    dueDate.setHours(23, 59, 59, 999);

    addTask(user?.uid || 'local', {
      title: quickTaskTitle,
      subjectId: quickTaskSubject || undefined,
      priority: quickTaskPriority,
      status: 'PENDENT',
      dueDate: dueDate.toISOString(),
      tags: [],
    });

    setQuickTaskTitle('');
    toast.success('Tasca afegida al calendari');
  };

  const getSubjectColor = (subjectId?: string) => {
    if (!subjectId) return 'var(--text-muted)';
    const sub = subjects.find((s) => s.id === subjectId);
    return sub ? sub.color : 'var(--text-muted)';
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'General';
    const sub = subjects.find((s) => s.id === subjectId);
    return sub ? sub.name : 'Desconeguda';
  };

  return (
    <div className="w-full space-y-6">
      {/* Capçalera del mòdul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Calendari Acadèmic
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Planifica les teves entregues i consulta l'historial d'estudi
          </p>
        </div>

        {/* Filtres de tipus de vista */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] self-start sm:self-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filterType === 'ALL'
                ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            Tot
          </button>
          <button
            onClick={() => setFilterType('TASKS')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filterType === 'TASKS'
                ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            Tasques
          </button>
          <button
            onClick={() => setFilterType('SESSIONS')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filterType === 'SESSIONS'
                ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            Sessions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panell Esquerre: El Calendari */}
        <div className="lg:col-span-2 card p-5 flex flex-col h-fit">
          {/* Capçalera del Calendari (Mes/Any i Nav) */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
              {MONTH_NAMES[month]} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-all"
              >
                Avui
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Dies de la setmana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-xs font-semibold text-[var(--text-muted)] py-1.5">
                {day}
              </div>
            ))}
          </div>

          {/* Dies de la quadrícula */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map(({ date, isCurrentMonth }, idx) => {
              const dateKey = getDateKey(date);
              const dayEvents = eventsByDate[dateKey] || { tasks: [], sessions: [] };

              const filteredTasks = filterType !== 'SESSIONS' ? dayEvents.tasks : [];
              const filteredSessions = filterType !== 'TASKS' ? dayEvents.sessions : [];

              const hasEvents = filteredTasks.length > 0 || filteredSessions.length > 0;

              return (
                <button
                  key={`${dateKey}-${idx}`}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'h-14 lg:h-16 xl:h-20 p-1.5 rounded-xl border flex flex-col justify-between items-start transition-all relative group overflow-hidden',
                    !isCurrentMonth && 'opacity-35 hover:opacity-60 bg-transparent border-transparent',
                    isCurrentMonth && 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-default)]',
                    isToday(date) && 'ring-2 ring-brand-500 ring-offset-2 border-brand-500/30',
                    isSelected(date) && 'bg-brand-500/6 border-brand-500'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center',
                      isToday(date) && 'bg-brand-500 text-white',
                      isSelected(date) && !isToday(date) && 'text-brand-500'
                    )}
                  >
                    {date.getDate()}
                  </span>

                  {/* Indicadors visuals d'esdeveniments */}
                  {hasEvents && (
                    <div className="w-full mt-1 space-y-1 overflow-hidden">
                      {/* Píndoles petites/dots depenent de la quantitat */}
                      <div className="flex flex-wrap gap-1 max-h-5 overflow-hidden">
                        {filteredTasks.map((t) => (
                          <span
                            key={t.id}
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getSubjectColor(t.subjectId) }}
                            title={`Tasca: ${t.title}`}
                          />
                        ))}
                        {filteredSessions.map((s) => (
                          <span
                            key={s.id}
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 border border-current"
                            style={{ color: getSubjectColor(s.subjectId), backgroundColor: 'transparent' }}
                            title={`Sessió: ${getSubjectName(s.subjectId)} (${s.durationMinutes}m)`}
                          />
                        ))}
                      </div>

                      {/* Títol en text petit en pantalles més grans (opcional/desactivat per evitar saturar) */}
                      <div className="hidden sm:block text-[9px] truncate text-[var(--text-secondary)] text-left leading-none font-medium">
                        {filteredTasks.length > 0 && `${filteredTasks.length} tasca${filteredTasks.length > 1 ? 's' : ''}`}
                        {filteredTasks.length > 0 && filteredSessions.length > 0 && ' · '}
                        {filteredSessions.length > 0 && `${formatDuration(filteredSessions.reduce((acc, cur) => acc + cur.durationMinutes, 0))}`}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panell Dret: Detall del Dia seleccionat i Afegir Ràpid */}
        <div className="space-y-6">
          {/* Llista d'esdeveniments */}
          <div className="card p-5">
            <div className="border-b border-[var(--border-subtle)] pb-4 mb-4">
              <h3 className="font-semibold text-sm text-[var(--text-muted)] uppercase tracking-wider">
                Detall del Dia
              </h3>
              <p className="font-display font-bold text-lg text-[var(--text-primary)] mt-1">
                {formatDate(selectedDate, 'long')}
              </p>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {/* Tasques del dia */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <CheckSquare size={13} />
                  Tasques ({selectedDayEvents.tasks.length})
                </h4>

                {selectedDayEvents.tasks.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)] italic p-2 bg-[var(--bg-elevated)] rounded-lg">
                    Sense entregues ni tasques previstes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] flex items-start justify-between gap-3 group"
                      >
                        <div className="flex gap-2 min-w-0">
                          <button
                            onClick={() => {
                              completeTask(task.id);
                              toast.success('Tasca completada! 🎉');
                            }}
                            className="mt-0.5 text-[var(--text-tertiary)] hover:text-[oklch(58%_0.22_140)] flex-shrink-0 transition-colors"
                          >
                            {task.status === 'COMPLETADA' ? (
                              <CheckCircle2 size={16} className="text-[oklch(58%_0.22_140)]" />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className={cn(
                              'text-sm font-medium text-[var(--text-primary)] truncate leading-tight',
                              task.status === 'COMPLETADA' && 'line-through text-[var(--text-muted)]'
                            )}>
                              {task.title}
                            </p>
                            <span
                              className="inline-block text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${getSubjectColor(task.subjectId)}20`,
                                color: getSubjectColor(task.subjectId)
                              }}
                            >
                              {getSubjectName(task.subjectId)}
                            </span>
                          </div>
                        </div>

                        {/* Botó Pomodoro ràpid si no està completada */}
                        {task.status !== 'COMPLETADA' && (
                          <button
                            onClick={() => navigate(`/pomodoro?task=${task.id}`)}
                            title="Començar sessió Pomodoro"
                            className="w-7 h-7 rounded-lg bg-[var(--bg-raised)] hover:bg-brand-500/15 text-[var(--text-secondary)] hover:text-brand-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <Play size={11} fill="currentColor" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sessions d'estudi del dia */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Clock size={13} />
                  Estudi Realitzat ({selectedDayEvents.sessions.length})
                </h4>

                {selectedDayEvents.sessions.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)] italic p-2 bg-[var(--bg-elevated)] rounded-lg">
                    Sense sessions d'estudi registrades
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${getSubjectColor(sess.subjectId)}20`,
                              color: getSubjectColor(sess.subjectId)
                            }}
                          >
                            {getSubjectName(sess.subjectId)}
                          </span>
                          <span className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                            <Clock size={10} />
                            {formatDuration(sess.durationMinutes)}
                          </span>
                        </div>
                        {sess.notes && (
                          <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-raised)] p-2 rounded-lg italic">
                            "{sess.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Planificació ràpida de tasca */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Plus size={14} /> Planificar Tasca
            </h3>
            <form onSubmit={handleCreateQuickTask} className="space-y-3">
              <Input
                id="quick-task-title"
                placeholder="Títol de la tasca..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] block mb-1">Assignatura</label>
                  <select
                    id="quick-task-subject"
                    value={quickTaskSubject}
                    onChange={(e) => setQuickTaskSubject(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                  >
                    <option value="">General</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] block mb-1">Prioritat</label>
                  <select
                    id="quick-task-priority"
                    value={quickTaskPriority}
                    onChange={(e) => setQuickTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <Button type="submit" fullWidth size="sm" className="mt-1">
                Planificar per al dia {selectedDate.getDate()}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
