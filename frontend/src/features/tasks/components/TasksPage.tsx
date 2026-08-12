import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, CheckCircle2, Clock, Trash2, Copy, Archive,
  AlertCircle, MoreVertical, BookOpen, X, SlidersHorizontal,
} from 'lucide-react';
import {
  useTasksStore,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type CreateTaskInput,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from '@/shared/stores/useTasksStore';
import { useSubjectsStore } from '@/shared/stores/useSubjectsStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn, formatDate, daysUntil } from '@/shared/lib/utils';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
function DueDateBadge({ dueDate, status }: { dueDate?: string; status: TaskStatus }) {
  if (!dueDate || status === 'COMPLETADA' || status === 'ARXIVADA') return null;
  const days = daysUntil(new Date(dueDate));
  if (days < 0) return <span className="text-xs text-[oklch(55%_0.25_25)] font-medium flex items-center gap-1"><AlertCircle size={11} /> Vençuda</span>;
  if (days === 0) return <span className="text-xs text-[oklch(65%_0.18_80)] font-medium">Avui</span>;
  if (days <= 3) return <span className="text-xs text-[oklch(65%_0.18_80)] font-medium">{days}d</span>;
  return <span className="text-xs text-[var(--text-muted)]">{formatDate(new Date(dueDate))}</span>;
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onDuplicate,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (t: Task) => void;
  onDuplicate: (id: string) => void;
}) {
  const { getSubjectById } = useSubjectsStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const subject = task.subjectId ? getSubjectById(task.subjectId) : undefined;
  const isCompleted = task.status === 'COMPLETADA';
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'card p-4 group relative',
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => !isCompleted && onComplete(task.id)}
          disabled={isCompleted}
          className={cn(
            'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            isCompleted
              ? 'border-[oklch(68%_0.18_160)] bg-[oklch(68%_0.18_160)]'
              : 'border-[var(--border-default)] hover:border-[oklch(58%_0.22_290)]'
          )}
        >
          {isCompleted && <CheckCircle2 size={12} className="text-white" />}
        </button>

        {/* Contingut */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm font-medium text-[var(--text-primary)] leading-snug',
              isCompleted && 'line-through text-[var(--text-muted)]'
            )}>
              {task.title}
            </p>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Menú */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <MoreVertical size={13} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-8 w-44 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl shadow-xl z-20 overflow-hidden"
                      onMouseLeave={() => setMenuOpen(false)}
                    >
                      {!isCompleted && (
                        <button onClick={() => { onEdit(task); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
                          <CheckCircle2 size={13} /> Editar
                        </button>
                      )}
                      <button onClick={() => { onDuplicate(task.id); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
                        <Copy size={13} /> Duplicar
                      </button>
                      <button onClick={() => { onArchive(task.id); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
                        <Archive size={13} /> Arxivar
                      </button>
                      <div className="border-t border-[var(--border-subtle)]" />
                      <button onClick={() => { onDelete(task); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[oklch(65%_0.25_25)] hover:bg-[oklch(65%_0.25_25_/_0.08)]">
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{task.description}</p>
          )}

          {/* Tags i meta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Prioritat */}
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: priority.bg, color: priority.color }}
            >
              {priority.label}
            </span>

            {/* Assignatura */}
            {subject && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
              >
                <BookOpen size={9} />
                {subject.name}
              </span>
            )}

            {/* Data límit */}
            <DueDateBadge dueDate={task.dueDate} status={task.status} />

            {/* Temps estimat */}
            {task.estimatedMinutes && (
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5">
                <Clock size={9} />
                {Math.round(task.estimatedMinutes / 60)}h
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({
  task,
  onClose,
  onSave,
}: {
  task?: Task;
  onClose: () => void;
  onSave: (data: CreateTaskInput) => void;
}) {
  const { subjects } = useSubjectsStore();
  const [form, setForm] = useState<CreateTaskInput>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'NORMAL',
    status: task?.status || 'PENDENT',
    subjectId: task?.subjectId || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    estimatedMinutes: task?.estimatedMinutes || undefined,
    tags: task?.tags || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'El títol és obligatori';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      subjectId: form.subjectId || undefined,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
    });
  };

  const PRIORITIES: TaskPriority[] = ['BAIXA', 'NORMAL', 'ALTA', 'URGENT'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
            {task ? 'Editar tasca' : 'Nova tasca'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <Input
            id="task-title"
            label="Títol de la tasca"
            placeholder="Ex: Estudiar tema 3 de Càlcul"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            error={errors.title}
            required
          />

          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">
              Descripció (opcional)
            </label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Afegeix detalls sobre la tasca..."
              value={form.description || ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[oklch(58%_0.22_290)] focus:ring-2 focus:ring-[oklch(58%_0.22_290_/_0.2)] resize-none transition-all"
            />
          </div>

          {/* Prioritat */}
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">Prioritat</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={cn(
                      'py-2 px-2 rounded-lg text-xs font-semibold border transition-all',
                      form.priority === p
                        ? 'ring-2 ring-offset-1'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    style={{
                      backgroundColor: cfg.bg,
                      color: cfg.color,
                      borderColor: form.priority === p ? cfg.color : 'transparent',
                      outline: form.priority === p ? `2px solid ${cfg.color}` : 'none',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignatura */}
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">
              Assignatura (opcional)
            </label>
            <select
              id="task-subject"
              value={form.subjectId || ''}
              onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[oklch(58%_0.22_290)]"
            >
              <option value="">Sense assignatura</option>
              {subjects.filter((s) => s.isActive).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Data límit i temps estimat */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="task-due"
              label="Data límit"
              type="date"
              value={form.dueDate ? form.dueDate.split('T')[0] : ''}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
            />
            <Input
              id="task-time"
              label="Temps estimat (min)"
              type="number"
              min={5}
              placeholder="60"
              value={form.estimatedMinutes || ''}
              onChange={(e) => setForm((p) => ({ ...p, estimatedMinutes: Number(e.target.value) || undefined }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel·lar</Button>
            <Button type="submit" fullWidth>{task ? 'Guardar' : 'Crear tasca'}</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Tasks Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, completeTask, archiveTask, duplicateTask, getActiveTasks } = useTasksStore();
  const { subjects } = useSubjectsStore();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'TOTES'>('TOTES');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'TOTES'>('TOTES');
  const [filterSubject, setFilterSubject] = useState<string>('TOTES');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Task | undefined>();

  const filtered = useMemo(() => {
    let result = getActiveTasks();
    if (filterStatus !== 'TOTES') result = result.filter((t) => t.status === filterStatus);
    if (filterPriority !== 'TOTES') result = result.filter((t) => t.priority === filterPriority);
    if (filterSubject !== 'TOTES') result = result.filter((t) => t.subjectId === filterSubject);
    if (search) result = result.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    return result.sort((a, b) => {
      // Urgent primer
      const order = { URGENT: 0, ALTA: 1, NORMAL: 2, BAIXA: 3 };
      return (order[a.priority] - order[b.priority]) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [tasks, filterStatus, filterPriority, filterSubject, search]);

  const pending = tasks.filter((t) => t.status === 'PENDENT').length;
  const completed = tasks.filter((t) => t.status === 'COMPLETADA').length;
  const urgent = tasks.filter((t) => t.priority === 'URGENT' && t.status !== 'COMPLETADA' && t.status !== 'ARXIVADA').length;

  const handleSave = (data: CreateTaskInput) => {
    if (editTask) {
      updateTask(editTask.id, data);
      toast.success('Tasca actualitzada');
    } else {
      addTask(user?.uid || 'local', data);
      toast.success('Tasca creada! ✅');
    }
    setModalOpen(false);
    setEditTask(undefined);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Capçalera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Tasques</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">
              {pending} pendents
            </span>
            <span className="text-xs text-[oklch(52%_0.18_160)] bg-[oklch(68%_0.18_160_/_0.1)] px-2 py-0.5 rounded-full">
              {completed} completades
            </span>
            {urgent > 0 && (
              <span className="text-xs text-[oklch(55%_0.25_25)] bg-[oklch(65%_0.25_25_/_0.1)] px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle size={10} /> {urgent} urgents
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => { setEditTask(undefined); setModalOpen(true); }}>
          <Plus size={16} /> Nova tasca
        </Button>
      </div>

      {/* Cerca i filtres */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="search-tasks"
            placeholder="Cercar tasques..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'h-10 px-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all',
            showFilters
              ? 'bg-[oklch(58%_0.22_290_/_0.1)] border-[oklch(58%_0.22_290_/_0.4)] text-[oklch(58%_0.22_290)]'
              : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          )}
        >
          <SlidersHorizontal size={15} />
          Filtres
          {(filterStatus !== 'TOTES' || filterPriority !== 'TOTES' || filterSubject !== 'TOTES') && (
            <span className="w-2 h-2 rounded-full bg-[oklch(58%_0.22_290)]" />
          )}
        </button>
      </div>

      {/* Panell de filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4 space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Estat */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Estat
                </label>
                <div className="flex flex-wrap gap-1">
                  {(['TOTES', 'PENDENT', 'EN_PROGRES', 'COMPLETADA'] as const).map((s) => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={cn('px-2 py-1 rounded-lg text-xs font-medium transition-all',
                        filterStatus === s
                          ? 'bg-[oklch(58%_0.22_290)] text-white'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]'
                      )}>
                      {s === 'TOTES' ? 'Totes' : STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prioritat */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Prioritat
                </label>
                <div className="flex flex-wrap gap-1">
                  {(['TOTES', 'URGENT', 'ALTA', 'NORMAL', 'BAIXA'] as const).map((p) => (
                    <button key={p} onClick={() => setFilterPriority(p)}
                      className={cn('px-2 py-1 rounded-lg text-xs font-medium transition-all',
                        filterPriority === p
                          ? 'bg-[oklch(58%_0.22_290)] text-white'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]'
                      )}>
                      {p === 'TOTES' ? 'Totes' : PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignatura */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Assignatura
                </label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="TOTES">Totes</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Llista de tasques */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-3 text-[var(--text-tertiary)]">
            <CheckCircle2 size={22} />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            {tasks.length === 0 ? 'Cap tasca creada' : 'Cap resultat'}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            {tasks.length === 0
              ? 'Crea la teva primera tasca per organitzar els teus estudis.'
              : 'Prova amb altres filtres o terme de cerca.'}
          </p>
          {tasks.length === 0 && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Crear primera tasca
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => { setEditTask(t); setModalOpen(true); }}
                onComplete={completeTask}
                onArchive={(id) => { archiveTask(id); toast.success('Tasca arxivada'); }}
                onDelete={setDeleteTarget}
                onDuplicate={(id) => { duplicateTask(id, user?.uid || 'local'); toast.success('Tasca duplicada'); }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <TaskModal
            task={editTask}
            onClose={() => { setModalOpen(false); setEditTask(undefined); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Confirmació eliminació */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(undefined)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-[oklch(65%_0.25_25_/_0.15)] flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-[oklch(55%_0.25_25)]" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-1">Eliminar tasca?</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-5">
                "<strong>{deleteTarget.title}</strong>" s'eliminarà permanentment.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(undefined)}>Cancel·lar</Button>
                <Button variant="danger" fullWidth onClick={() => { deleteTask(deleteTarget.id); toast.success('Tasca eliminada'); setDeleteTarget(undefined); }}>
                  Eliminar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
