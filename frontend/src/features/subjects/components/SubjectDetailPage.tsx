import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Trash2, Play, ExternalLink,
  FileText, Video, Link2, Book, Award, Clock, AlertTriangle,
  BarChart2, Settings, PlusCircle, TrendingUp
} from 'lucide-react';
import { useSubjectsStore, type ActivityType, type ResourceType, type DistributionMode } from '@/shared/stores/useSubjectsStore';
import { useSessionsStore } from '@/shared/stores/useSessionsStore';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn, formatDuration, slugify } from '@/shared/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';

export default function SubjectDetailPage() {
  const { courseId, subjectSlug } = useParams<{ courseId: string; subjectSlug: string }>();
  const navigate = useNavigate();
  const { subjects, updateSubject, addTopic, updateTopic, deleteTopic, addActivity, updateActivity, deleteActivity, addResource, deleteResource } = useSubjectsStore();
  const { sessions } = useSessionsStore();

  const subject = useMemo(() => {
    return subjects.find((s) => s.courseId === courseId && slugify(s.name) === subjectSlug);
  }, [subjects, courseId, subjectSlug]);

  const [activeTab, setActiveTab] = useState<'temes' | 'activitats' | 'examens' | 'recursos' | 'rendiment'>('temes');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Modals / Forms visibility
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  // Form states
  const [topicForm, setTopicForm] = useState({ name: '', description: '', targetGrade: 7 });
  const [activityForm, setActivityForm] = useState<{ name: string; type: ActivityType; date: string; grade: string; weight: number; completed: boolean; notes: string }>({
    name: '', type: 'TASCA', date: '', grade: '', weight: 0, completed: false, notes: ''
  });
  const [resourceForm, setResourceForm] = useState<{ name: string; type: ResourceType; url: string; description: string }>({
    name: '', type: 'ENLLAÇ', url: '', description: ''
  });

  // Edit config mode
  const [editConfig, setEditConfig] = useState(false);
  const [manualWeights, setManualWeights] = useState<Record<string, number>>({});

  if (!subject) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="font-bold text-lg text-[var(--text-primary)]">Assignatura no trobada</h3>
        <Link to="/assignatures" className="text-[oklch(58%_0.22_290)] hover:underline mt-2 inline-block">Tornar a assignatures</Link>
      </div>
    );
  }

  // ── Càlculs del tema i dedicacions ──────────────────────────────────────────
  const studyTimeByTopic = useMemo(() => {
    const map: Record<string, number> = {};
    sessions
      .filter((s) => s.subjectId === subject.id && s.topicId)
      .forEach((s) => {
        map[s.topicId!] = (map[s.topicId!] || 0) + s.durationMinutes;
      });
    return map;
  }, [sessions, subject.id]);

  const totalStudyTime = useMemo(() => {
    return sessions
      .filter((s) => s.subjectId === subject.id)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [sessions, subject.id]);

  // Estimació de dedicació recomanada
  const estimationDetails = useMemo(() => {
    return subject.topics.map((t) => {
      // Dificultat base = nota objectiu - nota actual
      const current = t.currentGrade ?? 5;
      const diffGap = Math.max(0.5, t.targetGrade - current);
      // Risc si té males notes
      const riskFactor = current < 5.5 ? 1.5 : current < 7 ? 1.2 : 1.0;
      // Hores recomanades base per setmana per aquest tema
      const recommendedHours = Math.round((2 + diffGap * 1.5) * riskFactor * 10) / 10;
      return {
        topicId: t.id,
        hours: recommendedHours
      };
    });
  }, [subject.topics]);

  // Alertes de dificultat detectades
  const difficultyAlerts = useMemo(() => {
    const alerts: string[] = [];
    subject.topics.forEach((t) => {
      if (t.currentGrade !== undefined && t.currentGrade < 5.5) {
        alerts.push(`El tema "${t.name}" té una mitjana baixa (${t.currentGrade}/10). Recomanem augmentar la dedicació.`);
      }
      // Si porta moltes activitats suspeses
      const failed = t.activities.filter(a => a.completed && a.grade !== undefined && a.grade < 5).length;
      if (failed >= 2) {
        alerts.push(`Has suspès ${failed} activitats al tema "${t.name}". Prioritza aquest tema en la planificació.`);
      }
    });
    return alerts;
  }, [subject.topics]);

  // ── Lògica de pesos manuals ──────────────────────────────────────────────────
  const startEditConfig = () => {
    const weights: Record<string, number> = {};
    subject.topics.forEach((t) => {
      weights[t.id] = t.weight;
    });
    setManualWeights(weights);
    setEditConfig(true);
  };

  const saveConfig = (mode: DistributionMode) => {
    if (mode === 'MANUAL') {
      const sum = Object.values(manualWeights).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.1) {
        toast.error(`La suma dels pesos ha de ser exactament 100% (actual: ${sum}%)`);
        return;
      }
      // Actualitzar cadascun
      subject.topics.forEach((t) => {
        updateTopic(subject.id, t.id, { weight: manualWeights[t.id] });
      });
    }
    updateSubject(subject.id, { topicDistributionMode: mode });
    setEditConfig(false);
    toast.success('Distribució de pesos guardada');
  };

  // ── Handlers de creació ──────────────────────────────────────────────────────
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return;
    addTopic(subject.id, topicForm.name, topicForm.description, topicForm.targetGrade);
    setTopicModalOpen(false);
    setTopicForm({ name: '', description: '', targetGrade: 7 });
    toast.success('Tema afegit! 📚');
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !activityForm.name.trim()) return;
    
    addActivity(subject.id, selectedTopicId, {
      name: activityForm.name,
      type: activityForm.type,
      date: activityForm.date || undefined,
      grade: activityForm.grade !== '' ? Number(activityForm.grade) : undefined,
      weight: activityForm.weight,
      completed: activityForm.completed,
      notes: activityForm.notes || undefined
    });

    // Feedback automàtic immediat
    if (activityForm.completed && activityForm.grade !== '') {
      const numGrade = Number(activityForm.grade);
      if (numGrade < 5.5) {
        toast((_t) => (
          <span className="flex flex-col gap-1 text-xs">
            <strong className="text-red-500">Feedback Automàtic:</strong>
            La nota obtinguda ({numGrade}/10) és baixa. Recomanem incrementar el temps de repàs d'aquest tema.
          </span>
        ), { duration: 5000 });
      } else {
        toast.success(`Gran feina! Has obtingut un ${numGrade}/10. Continua així! 🎉`);
      }
    }

    setActivityModalOpen(false);
    setActivityForm({ name: '', type: 'TASCA', date: '', grade: '', weight: 0, completed: false, notes: '' });
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !resourceForm.name.trim() || !resourceForm.url.trim()) return;

    addResource(subject.id, selectedTopicId, {
      name: resourceForm.name,
      type: resourceForm.type,
      url: resourceForm.url,
      description: resourceForm.description || undefined
    });

    setResourceModalOpen(false);
    setResourceForm({ name: '', type: 'ENLLAÇ', url: '', description: '' });
    toast.success('Recurs afegit');
  };

  // ── Dades de gràfics ─────────────────────────────────────────────────────────
  const chartEvolutionData = useMemo(() => {
    const list: Array<{ name: string; nota: number; data: string }> = [];
    subject.topics.forEach((t) => {
      t.activities
        .filter((a) => a.completed && a.grade !== undefined)
        .forEach((a) => {
          list.push({
            name: a.name,
            nota: a.grade!,
            data: a.date ? new Date(a.date).toLocaleDateString('ca-ES') : '—'
          });
        });
    });
    return list;
  }, [subject.topics]);

  const studyVsGradeData = useMemo(() => {
    return subject.topics.map((t) => {
      const hours = Math.round(((studyTimeByTopic[t.id] || 0) / 60) * 10) / 10;
      return {
        name: t.name.slice(0, 15),
        hores: hours,
        nota: t.currentGrade || 0
      };
    });
  }, [subject.topics, studyTimeByTopic]);

  return (
    <div className="w-full space-y-6">
      {/* Barra superior/Retorn */}
      <div className="flex items-center justify-between">
        <Link to="/assignatures" className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ChevronLeft size={16} /> Tornar a assignatures
        </Link>

        {/* Accions ràpides */}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setTopicModalOpen(true)}>
            <Plus size={14} className="mr-1" /> Nou Tema
          </Button>
          <button
            onClick={() => navigate(`/pomodoro?subject=${subject.id}`)}
            className="btn btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold bg-[oklch(58%_0.22_290)] text-white hover:bg-[oklch(54%_0.22_290)] flex items-center gap-1"
          >
            <Play size={12} fill="currentColor" /> Estudiar
          </button>
        </div>
      </div>

      {/* Capçalera Premium amb detalls de l'assignatura */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 md:p-8" style={{ backgroundColor: `${subject.color}12` }}>
        <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: subject.color }} />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: subject.color }}>
              {subject.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] leading-tight">{subject.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border" style={{ color: subject.color, borderColor: `${subject.color}40`, backgroundColor: `${subject.color}10` }}>
                  {subject.code || 'MAT'}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {subject.credits} Crèdits ECTS · Professor/a: <strong>{subject.professor || 'Desconegut'}</strong>
              </p>
            </div>
          </div>

          {/* Resum ràpid de notes/temps */}
          <div className="flex gap-4 border-l border-[var(--border-subtle)] pl-6">
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)]">Nota mitjana</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">{subject.currentGrade !== undefined ? `${subject.currentGrade}/10` : '—'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)]">Objectiu</p>
              <p className="text-2xl font-bold text-[var(--text-secondary)] mt-0.5">{subject.targetGrade}/10</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)]">Dedicació total</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">{formatDuration(totalStudyTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes de dificultat si n'hi ha */}
      {difficultyAlerts.length > 0 && (
        <div className="p-4 bg-red-950/5 border border-red-900/20 rounded-2xl space-y-2">
          <h4 className="text-sm font-bold text-[oklch(60%_0.25_25)] flex items-center gap-1.5">
            <AlertTriangle size={15} /> Alertes de Dificultat Acadèmica
          </h4>
          <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1 pl-1">
            {difficultyAlerts.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Pestanyes de navegació */}
      <div className="flex border-b border-[var(--border-subtle)]">
        {[
          { id: 'temes', label: 'Temes i Blocs', icon: Book },
          { id: 'activitats', label: 'Activitats i Tasques', icon: Award },
          { id: 'examens', label: 'Exàmens', icon: Book },
          { id: 'recursos', label: 'Recursos d\'Estudi', icon: FileText },
          { id: 'rendiment', label: 'Rendiment i Dedicació', icon: BarChart2 }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all',
              activeTab === t.id
                ? 'border-[oklch(58%_0.22_290)] text-[oklch(58%_0.22_290)] font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Pestanya 1: Temes i Blocs */}
      {activeTab === 'temes' && (
        <div className="space-y-6">
          {/* Configuració de distribució de pesos */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1">
                <Settings size={14} /> Distribució de pesos dels temes
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Pes actual: {subject.topicDistributionMode === 'AUTOMATIC' ? 'Automàtic (uniforme)' : 'Manual (personalitzat)'}
              </p>
            </div>

            {!editConfig ? (
              <Button size="sm" variant="secondary" onClick={startEditConfig}>Configurar Pesos</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => saveConfig('AUTOMATIC')}>Distribuir Uniformement</Button>
                <Button size="sm" onClick={() => saveConfig('MANUAL')}>Guardar Pesos Manuals</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditConfig(false)}>✕</Button>
              </div>
            )}
          </div>

          {subject.topics.length === 0 ? (
            <div className="card p-12 text-center">
              <Book size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <h4 className="font-semibold text-[var(--text-primary)] mb-1">Cap tema afegit</h4>
              <p className="text-xs text-[var(--text-muted)] mb-4">Crea temes per dividir l'assignatura en blocs d'estudi.</p>
              <Button size="sm" onClick={() => setTopicModalOpen(true)}>Crear Primer Tema</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subject.topics.map((topic) => {
                const completedCount = topic.activities.filter(a => a.completed).length;
                const progressPct = topic.activities.length > 0 ? Math.round((completedCount / topic.activities.length) * 100) : 0;
                const studyHours = Math.round(((studyTimeByTopic[topic.id] || 0) / 60) * 10) / 10;
                const recHours = estimationDetails.find((e) => e.topicId === topic.id)?.hours || 2;
                
                return (
                  <div key={topic.id} className="card p-5 space-y-4 hover:border-[var(--border-default)] transition-colors relative flex flex-col justify-between">
                    <div>
                      {/* Capçalera del tema */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-base text-[var(--text-primary)]">{topic.name}</h4>
                          {topic.description && <p className="text-xs text-[var(--text-muted)] mt-1">{topic.description}</p>}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                          Pes: {editConfig ? (
                            <input
                              type="number"
                              value={manualWeights[topic.id] ?? topic.weight}
                              onChange={(e) => setManualWeights({ ...manualWeights, [topic.id]: Number(e.target.value) })}
                              className="w-10 bg-transparent text-center focus:outline-none font-bold"
                            />
                          ) : `${topic.weight}%`}
                        </span>
                      </div>

                      {/* Progrés */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs text-[var(--text-muted)]">
                          <span>Completat: {completedCount}/{topic.activities.length} activitats</span>
                          <span className="font-semibold text-[var(--text-primary)]">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div className="h-full bg-[oklch(58%_0.22_290)] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>

                      {/* Detalls de qualificació i hores recomanades */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                        <div>
                          <p className="text-[var(--text-muted)] mb-0.5">Nota mitjana / Objectiu</p>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {topic.currentGrade !== undefined ? `${topic.currentGrade}/10` : '—'} <span className="text-[var(--text-muted)]">vs {topic.targetGrade}/10</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--text-muted)] mb-0.5">Estudi Setmanal Recomanat</p>
                          <p className="font-semibold text-[oklch(58%_0.22_290)] flex items-center gap-1">
                            <Clock size={11} /> {recHours}h <span className="text-xs text-[var(--text-muted)]">({studyHours}h reals)</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botons d'acció del tema */}
                    <div className="flex gap-2 pt-4 justify-between items-center mt-3 border-t border-[var(--border-subtle)]">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setSelectedTopicId(topic.id); setActivityModalOpen(true); }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] flex items-center gap-1"
                        >
                          <PlusCircle size={12} /> Afegir Activitat
                        </button>
                        <button
                          onClick={() => { setSelectedTopicId(topic.id); setResourceModalOpen(true); }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] flex items-center gap-1"
                        >
                          <FileText size={12} /> Recurs
                        </button>
                      </div>

                      <button
                        onClick={() => deleteTopic(subject.id, topic.id)}
                        className="text-[oklch(65%_0.25_25)] hover:bg-[oklch(65%_0.25_25_/_0.08)] p-1.5 rounded-lg transition-colors"
                        title="Eliminar tema"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pestanya 2: Activitats i Tasques del tema */}
      {activeTab === 'activitats' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base text-[var(--text-primary)]">Activitats de l'assignatura</h3>
            <p className="text-xs text-[var(--text-muted)]">Pesos repartits automàticament / manuals dins de cada tema.</p>
          </div>

          <div className="space-y-4">
            {subject.topics.map((topic) => (
              <div key={topic.id} className="card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <h4 className="font-bold text-sm text-[oklch(58%_0.22_290)]">{topic.name}</h4>
                  <span className="text-[10px] text-[var(--text-muted)]">Pes total: {topic.weight}% de l'assignatura</span>
                </div>

                {topic.activities.length === 0 ? (
                  <p className="text-xs italic text-[var(--text-muted)] py-2">Cap activitat creada per a aquest tema.</p>
                ) : (
                  <div className="space-y-2">
                    {topic.activities.map((act) => (
                      <div key={act.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={act.completed}
                            onChange={(e) => updateActivity(subject.id, topic.id, act.id, { completed: e.target.checked })}
                            className="w-4 h-4 rounded border-[var(--border-default)] accent-[oklch(58%_0.22_290)]"
                          />
                          <div>
                            <p className={cn("text-xs font-semibold text-[var(--text-primary)]", act.completed && "line-through text-[var(--text-muted)]")}>
                              {act.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{act.type}</span>
                              <span className="text-[9px] text-[var(--text-muted)]">Pes: {act.weight}% del tema</span>
                              {act.date && <span className="text-[9px] text-[var(--text-muted)]">Vence: {new Date(act.date).toLocaleDateString('ca-ES')}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Qualificació */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[var(--text-muted)]">Nota:</span>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.1}
                              placeholder="—"
                              value={act.grade ?? ''}
                              onChange={(e) => {
                                const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                updateActivity(subject.id, topic.id, act.id, { grade: val, completed: val !== undefined ? true : act.completed });
                              }}
                              className="w-12 text-center bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold py-1 focus:outline-none focus:border-[oklch(58%_0.22_290)]"
                            />
                          </div>

                          {/* Estudiar Pomodoro ràpid */}
                          <button
                            onClick={() => navigate(`/pomodoro?subject=${subject.id}&topic=${topic.id}&activity=${act.id}`)}
                            title="Estudiar amb Pomodoro"
                            className="w-7 h-7 rounded-lg bg-[var(--bg-overlay)] hover:bg-[oklch(58%_0.22_290_/_0.15)] text-[var(--text-secondary)] hover:text-[oklch(58%_0.22_290)] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <Play size={11} fill="currentColor" />
                          </button>

                          <button
                            onClick={() => deleteActivity(subject.id, topic.id, act.id)}
                            className="text-[oklch(65%_0.25_25)] hover:bg-[oklch(65%_0.25_25_/_0.08)] p-1 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestanya Exàmens (Dedicada) */}
      {activeTab === 'examens' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base text-[var(--text-primary)]">Exàmens de l'assignatura</h3>
            <p className="text-xs text-[var(--text-muted)]">Control de qualificacions i dates clau dels teus exàmens.</p>
          </div>

          <div className="space-y-4">
            {subject.topics.map((topic) => {
              const exams = topic.activities.filter(a => a.type === 'EXAMEN');
              if (exams.length === 0) return null;

              return (
                <div key={topic.id} className="card p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <h4 className="font-bold text-sm text-[oklch(58%_0.22_290)]">{topic.name}</h4>
                    <span className="text-[10px] text-[var(--text-muted)]">Exàmens del tema</span>
                  </div>

                  <div className="space-y-2">
                    {exams.map((act) => (
                      <div key={act.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={act.completed}
                            onChange={(e) => updateActivity(subject.id, topic.id, act.id, { completed: e.target.checked })}
                            className="w-4 h-4 rounded border-[var(--border-default)] accent-[oklch(58%_0.22_290)]"
                          />
                          <div>
                            <p className={cn("text-xs font-semibold text-[var(--text-primary)]", act.completed && "line-through text-[var(--text-muted)]")}>
                              {act.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-red-500">EXAMEN</span>
                              <span className="text-[9px] text-[var(--text-muted)]">Pes: {act.weight}% del tema</span>
                              {act.date && <span className="text-[9px] text-[var(--text-muted)]">Data: {new Date(act.date).toLocaleDateString('ca-ES')}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Qualificació */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[var(--text-muted)]">Nota:</span>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.1}
                              placeholder="—"
                              value={act.grade ?? ''}
                              onChange={(e) => {
                                const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                updateActivity(subject.id, topic.id, act.id, { grade: val, completed: val !== undefined ? true : act.completed });
                              }}
                              className="w-12 text-center bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold py-1 focus:outline-none focus:border-[oklch(58%_0.22_290)]"
                            />
                          </div>

                          {/* Estudiar Pomodoro ràpid */}
                          <button
                            onClick={() => navigate(`/pomodoro?subject=${subject.id}&topic=${topic.id}&activity=${act.id}`)}
                            title="Estudiar amb Pomodoro"
                            className="w-7 h-7 rounded-lg bg-[var(--bg-overlay)] hover:bg-[oklch(58%_0.22_290_/_0.15)] text-[var(--text-secondary)] hover:text-[oklch(58%_0.22_290)] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <Play size={11} fill="currentColor" />
                          </button>

                          <button
                            onClick={() => deleteActivity(subject.id, topic.id, act.id)}
                            className="text-[oklch(65%_0.25_25)] hover:bg-[oklch(65%_0.25_25_/_0.08)] p-1 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {subject.topics.every(t => t.activities.filter(a => a.type === 'EXAMEN').length === 0) && (
              <div className="card p-8 text-center text-xs text-[var(--text-muted)] italic">
                No s'han planificat exàmens per a cap tema d'aquesta assignatura.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestanya 3: Recursos d'Estudi */}
      {activeTab === 'recursos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-base text-[var(--text-primary)]">Recursos de l'assignatura</h3>
            <p className="text-xs text-[var(--text-muted)]">Fitxers, apunts, enllaços i vídeos per tema.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subject.topics.map((topic) => (
              <div key={topic.id} className="card p-5 space-y-3">
                <h4 className="font-bold text-sm text-[oklch(58%_0.22_290)] border-b border-[var(--border-subtle)] pb-2">{topic.name}</h4>
                
                {topic.resources.length === 0 ? (
                  <p className="text-xs italic text-[var(--text-muted)] py-4 text-center">Cap recurs afegit per a aquest tema.</p>
                ) : (
                  <div className="space-y-2">
                    {topic.resources.map((res) => (
                      <div key={res.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-overlay)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
                            {res.type === 'PDF' && <FileText size={16} />}
                            {res.type === 'VIDEO' && <Video size={16} />}
                            {res.type === 'ENLLAÇ' && <Link2 size={16} />}
                            {(res.type === 'APUNTS' || res.type === 'DOCUMENT') && <Book size={16} />}
                          </div>
                          <div className="min-w-0">
                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--text-primary)] hover:text-[oklch(58%_0.22_290)] flex items-center gap-1 truncate">
                              {res.name} <ExternalLink size={10} />
                            </a>
                            {res.description && <p className="text-[10px] text-[var(--text-muted)] truncate">{res.description}</p>}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteResource(subject.id, topic.id, res.id)}
                          className="text-[oklch(65%_0.25_25)] hover:bg-[oklch(65%_0.25_25_/_0.08)] p-1 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestanya 4: Rendiment i Dedicació */}
      {activeTab === 'rendiment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolució temporal de les notes */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1">
              <TrendingUp size={15} /> Evolució temporal de les qualificacions
            </h3>
            {chartEvolutionData.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-12">Cap activitat avaluada encara per mostrar l'evolució.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartEvolutionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="nota" stroke="oklch(58%_0.22_290)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Hores invertides vs Nota mitjana per tema */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1">
              <BarChart2 size={15} /> Relació Temps Invertit vs Nota per Tema
            </h3>
            {subject.topics.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-12">Afegeix temes i registra temps per analitzar la productivitat.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={studyVsGradeData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="hores" name="Hores d'estudi" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nota" name="Nota mitjana" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}
      
      {/* 1. Modal Tema */}
      <AnimatePresence>
        {topicModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTopicModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Nou Tema o Bloc</h3>
                <button onClick={() => setTopicModalOpen(false)} className="text-[var(--text-muted)]">✕</button>
              </div>
              <form onSubmit={handleCreateTopic} className="space-y-3">
                <Input id="topic-name" label="Títol del Tema" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} required />
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Descripció</label>
                  <textarea value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} rows={2} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none" placeholder="Ex: Matrius i determinants..." />
                </div>
                <Input id="topic-target" label="Nota Objectiu" type="number" min={1} max={10} step={0.5} value={topicForm.targetGrade} onChange={(e) => setTopicForm({ ...topicForm, targetGrade: Number(e.target.value) })} required />
                <Button type="submit" fullWidth size="sm">Crear Tema</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal Activitat */}
      <AnimatePresence>
        {activityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivityModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Nova Activitat / Tasca</h3>
                <button onClick={() => setActivityModalOpen(false)} className="text-[var(--text-muted)]">✕</button>
              </div>
              <form onSubmit={handleCreateActivity} className="space-y-3">
                <Input id="act-name" label="Títol de l'activitat" value={activityForm.name} onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })} required />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--text-secondary)] block mb-1">Tipus</label>
                    <select
                      value={activityForm.type}
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="EXAMEN">Examen</option>
                      <option value="PRACTICA">Pràctica</option>
                      <option value="PROJECTE">Projecte</option>
                      <option value="EXERCICI">Exercici</option>
                      <option value="TASCA">Tasca</option>
                    </select>
                  </div>
                  <Input id="act-date" label="Data límit" type="date" value={activityForm.date} onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input id="act-grade" label="Nota (Qualificació)" type="number" min={0} max={10} step={0.1} placeholder="—" value={activityForm.grade} onChange={(e) => setActivityForm({ ...activityForm, grade: e.target.value })} />
                  <Input id="act-weight" label="Pes en el tema (%)" type="number" min={1} max={100} value={activityForm.weight || ''} onChange={(e) => setActivityForm({ ...activityForm, weight: Number(e.target.value) })} />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={activityForm.completed} onChange={(e) => setActivityForm({ ...activityForm, completed: e.target.checked })} className="w-4 h-4 rounded border-[var(--border-default)] accent-[oklch(58%_0.22_290)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Marcar com a completada</span>
                </div>

                <Button type="submit" fullWidth size="sm">Crear Activitat</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal Recursos */}
      <AnimatePresence>
        {resourceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResourceModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Nou Recurs d'Estudi</h3>
                <button onClick={() => setResourceModalOpen(false)} className="text-[var(--text-muted)]">✕</button>
              </div>
              <form onSubmit={handleCreateResource} className="space-y-3">
                <Input id="res-name" label="Títol del recurs" value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} required />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--text-secondary)] block mb-1">Tipus</label>
                    <select
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value as ResourceType })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="PDF">PDF</option>
                      <option value="VIDEO">Vídeo</option>
                      <option value="ENLLAÇ">Enllaç web</option>
                      <option value="APUNTS">Apunts</option>
                      <option value="DOCUMENT">Document</option>
                    </select>
                  </div>
                  <Input id="res-url" label="URL / Enllaç" placeholder="https://..." value={resourceForm.url} onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })} required />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Descripció</label>
                  <textarea value={resourceForm.description} onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })} rows={2} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none" placeholder="Breu comentari sobre el recurs..." />
                </div>

                <Button type="submit" fullWidth size="sm">Guardar Recurs</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
