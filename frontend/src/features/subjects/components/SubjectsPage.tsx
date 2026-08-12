import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Edit2, Trash2, MoreVertical,
  GraduationCap, X,
} from 'lucide-react';
import { useSubjectsStore, SUBJECT_COLORS, type Subject, type CreateSubjectInput } from '@/shared/stores/useSubjectsStore';
import { useTasksStore } from '@/shared/stores/useTasksStore';
import { useSessionsStore } from '@/shared/stores/useSessionsStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn, formatDuration, slugify } from '@/shared/lib/utils';
import toast from 'react-hot-toast';

// ── Subject Card ──────────────────────────────────────────────────────────────
function SubjectCard({
  subject,
  onEdit,
  onDelete,
  currentCourse,
}: {
  subject: Subject;
  onEdit: (s: Subject) => void;
  onDelete: (s: Subject) => void;
  currentCourse: string;
}) {
  const { getTasksBySubject } = useTasksStore();
  const { getMinutesBySubject } = useSessionsStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const tasks = getTasksBySubject(subject.id);
  const pendingTasks = tasks.filter((t) => t.status === 'PENDENT' || t.status === 'EN_PROGRES').length;
  const minutesThisWeek = getMinutesBySubject(subject.id, 7);
  const subjectSlug = slugify(subject.name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card p-5 relative group"
    >
      {/* Franja de color */}
      <div
        className="absolute top-px left-px right-px h-1.5 rounded-t-[calc(var(--radius-xl)-1px)]"
        style={{ backgroundColor: subject.color }}
      />

      {/* Capçalera */}
      <div className="flex items-start justify-between mt-1">
        <Link to={`/${currentCourse}/assignatures/${subjectSlug}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ backgroundColor: subject.color }}
          >
            {subject.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] truncate leading-tight">
              {subject.name}
            </h3>
            {subject.code && (
              <p className="text-xs text-[var(--text-muted)]">{subject.code}</p>
            )}
          </div>
        </Link>

        {/* Menú accions */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical size={15} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-9 w-40 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl shadow-xl z-20 overflow-hidden"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => { onEdit(subject); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  onClick={() => { onDelete(subject); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[oklch(65%_0.25_25)] hover:bg-[oklch(65%_0.25_25_/_0.08)]"
                >
                  <Trash2 size={13} /> Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Estadístiques */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
          <p className="text-lg font-bold text-[var(--text-primary)]">{subject.credits !== undefined ? subject.credits : '—'}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Crèdits</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
          <p className="text-lg font-bold text-[var(--text-primary)]">{pendingTasks}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Tasques</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {minutesThisWeek > 0 ? formatDuration(minutesThisWeek) : '0h'}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Setmana</p>
        </div>
      </div>

      {/* Barra de nota */}
      {(subject.currentGrade !== undefined || subject.targetGrade) && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>Nota actual</span>
            <span className="font-medium text-[var(--text-primary)]">
              {subject.currentGrade !== undefined ? `${subject.currentGrade}/10` : '—'} → {subject.targetGrade}/10
            </span>
          </div>
          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: subject.color,
                width: `${((subject.currentGrade ?? 0) / 10) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Professor */}
      {subject.professor && (
        <p className="mt-3 text-xs text-[var(--text-muted)] flex items-center gap-1">
          <GraduationCap size={11} />
          {subject.professor}
        </p>
      )}
    </motion.div>
  );
}

// ── Subject Modal ─────────────────────────────────────────────────────────────
function SubjectModal({
  subject,
  onClose,
  onSave,
}: {
  subject?: Subject;
  onClose: () => void;
  onSave: (data: CreateSubjectInput) => void;
}) {
  const { subjects } = useSubjectsStore();
  const { userProfile } = useAuth();
  const currentCourse = userProfile?.currentCourse || 'DAW1';

  const [form, setForm] = useState<CreateSubjectInput>({
    courseId: subject?.courseId || '',
    name: subject?.name || '',
    code: subject?.code || '',
    credits: subject?.credits !== undefined ? subject.credits : undefined,
    professor: subject?.professor || '',
    color: subject?.color || '#ef4444',
    semester: subject?.semester || '2024-25 S2',
    academicYear: subject?.academicYear || '2024-25',
    targetGrade: subject?.targetGrade || 7,
    currentGrade: subject?.currentGrade,
    weeklyHoursObjective: subject?.weeklyHoursObjective || 4,
    isActive: subject?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const takenColors = subjects
    .filter((s) => s.courseId === currentCourse && s.id !== subject?.id)
    .map((s) => s.color);

  const update = (field: keyof CreateSubjectInput) => (val: unknown) =>
    setForm((p) => ({ ...p, [field]: val }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'El nom és obligatori';
    if (takenColors.includes(form.color)) {
      errs.color = 'Aquest color ja està assignat a una altra assignatura d\'aquest mateix curs';
      toast.error(errs.color);
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
            {subject ? 'Editar assignatura' : 'Nova assignatura'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Color picker */}
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] block mb-2">Color (Un per assignatura)</label>
            <div className="grid grid-cols-10 gap-2 w-fit">
              {SUBJECT_COLORS.map((c) => {
                const isTaken = takenColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={isTaken}
                    onClick={() => update('color')(c)}
                    className={cn(
                      'w-7 h-7 rounded-lg transition-all relative overflow-hidden',
                      form.color === c && 'ring-2 ring-offset-2 ring-[var(--border-default)] scale-110',
                      isTaken ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
                    )}
                    style={{ backgroundColor: c }}
                    title={isTaken ? `${c} (Ja assignat a aquest curs)` : c}
                  />
                );
              })}
            </div>
          </div>

          {/* Previsualització */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: `${form.color}15`, border: `1px solid ${form.color}30` }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: form.color }}
            >
              {form.name.slice(0, 2).toUpperCase() || 'AS'}
            </div>
            <span className="font-medium text-[var(--text-primary)] text-sm">
              {form.name || 'Nom de l\'assignatura'}
            </span>
          </div>

          <Input
            id="subj-name"
            label="Nom de l'assignatura"
            placeholder="Ex: Càlcul I"
            value={form.name}
            onChange={(e) => update('name')(e.target.value)}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="subj-code"
              label="Codi (opcional)"
              placeholder="Ex: MAT101"
              value={form.code || ''}
              onChange={(e) => update('code')(e.target.value)}
            />
            <Input
              id="subj-credits"
              label="Crèdits ECTS (opcional)"
              type="number"
              min={1}
              max={30}
              value={form.credits !== undefined ? form.credits : ''}
              onChange={(e) => update('credits')(e.target.value !== '' ? Number(e.target.value) : undefined)}
              error={errors.credits}
            />
          </div>

          <Input
            id="subj-professor"
            label="Professor/a (opcional)"
            placeholder="Ex: Dr. García López"
            value={form.professor || ''}
            onChange={(e) => update('professor')(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">
                Nota objectiu
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="subj-target"
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={form.targetGrade}
                  onChange={(e) => update('targetGrade')(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-[var(--text-primary)] w-8 text-center">
                  {form.targetGrade}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">
                Nota actual
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="subj-current"
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={form.currentGrade ?? 0}
                  onChange={(e) => update('currentGrade')(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-[var(--text-primary)] w-8 text-center">
                  {form.currentGrade ?? 0}
                </span>
              </div>
            </div>
          </div>

          <Input
            id="subj-hours"
            label="Hores setmanals objectiu"
            type="number"
            min={1}
            max={40}
            value={form.weeklyHoursObjective || 4}
            onChange={(e) => update('weeklyHoursObjective')(Number(e.target.value))}
          />

          {/* Accions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel·lar
            </Button>
            <Button type="submit" fullWidth>
              {subject ? 'Guardar canvis' : 'Crear assignatura'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Subjects Page ─────────────────────────────────────────────────────────────
export default function SubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjectsStore();
  const { user, userProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Subject | undefined>();

  const currentCourse = userProfile?.currentCourse || 'DAW1';

  // Filtrar assignatures primer pel curs actual i després per text de cerca
  const courseSubjects = subjects.filter((s) => s.courseId === currentCourse);
  const filtered = courseSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: CreateSubjectInput) => {
    if (editSubject) {
      updateSubject(editSubject.id, { ...data, courseId: currentCourse });
      toast.success('Assignatura actualitzada');
    } else {
      addSubject(user?.uid || 'local', { ...data, courseId: currentCourse });
      toast.success('Assignatura creada! 🎉');
    }
    setModalOpen(false);
    setEditSubject(undefined);
  };

  const handleEdit = (s: Subject) => {
    setEditSubject(s);
    setModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteSubject(deleteTarget.id);
    toast.success('Assignatura eliminada');
    setDeleteTarget(undefined);
  };

  const totalCredits = courseSubjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div className="w-full space-y-6">
      {/* Capçalera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Assignatures
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {courseSubjects.length} assignatures · {totalCredits} crèdits totals
          </p>
        </div>
        <Button onClick={() => { setEditSubject(undefined); setModalOpen(true); }}>
          <Plus size={16} />
          Nova assignatura
        </Button>
      </div>

      {/* Barra de cerca */}
      {courseSubjects.length > 0 && (
        <Input
          id="search-subjects"
          placeholder="Cercar assignatures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={Search}
        />
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-16">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4 text-[var(--text-tertiary)]">
              <BookOpen size={24} />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              {search ? 'Cap assignatura coincideix' : 'Cap assignatura afegida'}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-xs mb-4">
              {search
                ? 'Prova amb un altre terme de cerca.'
                : 'Afegeix les teves assignatures per organitzar tasques, exàmens i notes.'}
            </p>
            {!search && (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={16} />
                Afegir primera assignatura
              </Button>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filtered.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                currentCourse={currentCourse}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {modalOpen && (
          <SubjectModal
            subject={editSubject}
            onClose={() => { setModalOpen(false); setEditSubject(undefined); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Confirmació d'eliminació */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteTarget(undefined)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-[oklch(65%_0.25_25_/_0.15)] flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-[oklch(55%_0.25_25)]" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-1">
                Eliminar assignatura?
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-5">
                Estàs a punt d'eliminar <strong>"{deleteTarget.name}"</strong>. Aquesta acció no es pot desfer.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(undefined)}>
                  Cancel·lar
                </Button>
                <Button variant="danger" fullWidth onClick={handleDeleteConfirm}>
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
