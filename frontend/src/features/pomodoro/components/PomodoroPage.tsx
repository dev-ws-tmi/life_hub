import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Square, SkipForward, Settings, Coffee,
  Zap, Volume2, VolumeX, Clock,
} from 'lucide-react';
import { usePomodoroStore, type PomodoroPhase } from '@/shared/stores/usePomodoroStore';
import { useSessionsStore, type StudySession } from '@/shared/stores/useSessionsStore';
import { useSubjectsStore } from '@/shared/stores/useSubjectsStore';
import { useTasksStore } from '@/shared/stores/useTasksStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn, formatDuration } from '@/shared/lib/utils';
import toast from 'react-hot-toast';

// ── Constants de fase ─────────────────────────────────────────────────────────
const PHASE_CONFIG: Record<PomodoroPhase, { label: string; color: string; bg: string; icon: typeof Zap; emoji: string }> = {
  TREBALL:      { label: 'Temps de treball',  color: '#6366f1', bg: '#6366f115', icon: Zap,    emoji: '🎯' },
  DESCANS_CURT: { label: 'Descans curt',       color: '#22c55e', bg: '#22c55e15', icon: Coffee, emoji: '☕' },
  DESCANS_LLARG:{ label: 'Descans llarg',      color: '#06b6d4', bg: '#06b6d415', icon: Coffee, emoji: '🌿' },
};

// ── Cercle SVG animat ─────────────────────────────────────────────────────────
function CircleTimer({
  timeLeft,
  total,
  phase,
  isRunning,
}: {
  timeLeft: number;
  total: number;
  phase: PomodoroPhase;
  isRunning: boolean;
}) {
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / total;
  const dashOffset = circumference * (1 - progress);
  const cfg = PHASE_CONFIG[phase];

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="280" height="280" className="-rotate-90">
        {/* Track */}
        <circle
          cx="140" cy="140" r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth="8"
        />
        {/* Progress */}
        <motion.circle
          cx="140" cy="140" r={radius}
          fill="none"
          stroke={cfg.color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${cfg.color}60)` }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>

      {/* Contingut central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl mb-1">{cfg.emoji}</span>
        <div className="font-display font-bold text-5xl text-[var(--text-primary)] tabular-nums tracking-tight">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{cfg.label}</p>
        {isRunning && (
          <motion.div
            className="flex gap-1 mt-2"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Pomodoro dots ─────────────────────────────────────────────────────────────
function PomodoroDots({ count, longBreakAfter }: { count: number; longBreakAfter: number }) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {Array.from({ length: longBreakAfter }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-3 h-3 rounded-full transition-all duration-300',
            i < (count % longBreakAfter) || (count > 0 && count % longBreakAfter === 0 && i < longBreakAfter)
              ? 'bg-[oklch(58%_0.22_290)] scale-110'
              : 'bg-[var(--bg-overlay)] border border-[var(--border-default)]'
          )}
        />
      ))}
    </div>
  );
}

// ── Config Panel ──────────────────────────────────────────────────────────────
function ConfigPanel({ onClose }: { onClose: () => void }) {
  const { config, setConfig } = usePomodoroStore();
  const [local, setLocal] = useState(config);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)]">Configuració del Timer</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'workMinutes', label: 'Treball', min: 5, max: 90 },
          { key: 'shortBreakMinutes', label: 'Descans curt', min: 1, max: 30 },
          { key: 'longBreakMinutes', label: 'Descans llarg', min: 5, max: 60 },
        ].map(({ key, label, min, max }) => (
          <div key={key} className="text-center">
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-2">{label}</label>
            <div className="flex items-center gap-1 justify-center">
              <button
                onClick={() => setLocal((p) => ({ ...p, [key]: Math.max(min, (p[key as keyof typeof p] as number) - 5) }))}
                className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] text-sm font-bold"
              >−</button>
              <span className="text-lg font-bold text-[var(--text-primary)] w-8 text-center">
                {local[key as keyof typeof local] as number}
              </span>
              <button
                onClick={() => setLocal((p) => ({ ...p, [key]: Math.min(max, (p[key as keyof typeof p] as number) + 5) }))}
                className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] text-sm font-bold"
              >+</button>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">minuts</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
        <span className="text-sm text-[var(--text-secondary)]">Descans llarg cada</span>
        <div className="flex items-center gap-2">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setLocal((p) => ({ ...p, longBreakAfter: n }))}
              className={cn(
                'w-7 h-7 rounded-lg text-sm font-semibold transition-all',
                local.longBreakAfter === n
                  ? 'bg-[oklch(58%_0.22_290)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
              )}
            >
              {n}
            </button>
          ))}
          <span className="text-xs text-[var(--text-muted)]">pomodoros</span>
        </div>
      </div>

      <button
        onClick={() => { setConfig(local); toast.success('Configuració guardada'); onClose(); }}
        className="w-full py-2.5 rounded-xl bg-[oklch(58%_0.22_290)] text-white text-sm font-semibold hover:bg-[oklch(54%_0.22_290)] transition-colors"
      >
        Guardar configuració
      </button>
    </motion.div>
  );
}

// ── History Item ──────────────────────────────────────────────────────────────
function SessionHistoryItem({ session }: { session: StudySession }) {
  const { getSubjectById } = useSubjectsStore();
  const subject = session.subjectId ? getSubjectById(session.subjectId) : undefined;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
        style={{ backgroundColor: subject?.color || '#6366f1' }}
      >
        🍅
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {subject?.name || 'Sense assignatura'}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {new Date(session.startTime).toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          {' · '}
          {formatDuration(session.durationMinutes)}
        </p>
      </div>
      {session.pomodorosCompleted && (
        <span className="text-xs font-semibold text-[oklch(58%_0.22_290)]">
          ×{session.pomodorosCompleted}
        </span>
      )}
    </div>
  );
}

// ── Pomodoro Page ─────────────────────────────────────────────────────────────
export default function PomodoroPage() {
  const {
    config, phase, timeLeft, isRunning, isPaused, pomodoroCount,
    currentSubjectId, currentTaskId, currentTopicId,
    start, pause, resume, stop, tick, skipPhase, setSubject, setTask, setTopic,
  } = usePomodoroStore();

  const { addSession, sessions } = useSessionsStore();
  const { subjects } = useSubjectsStore();
  const { getPendingTasks } = useTasksStore();
  const { user } = useAuth();

  const [showConfig, setShowConfig] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousPhase, setPreviousPhase] = useState<PomodoroPhase>(phase);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Calcula el total de la fase actual
  const phaseTotal = phase === 'TREBALL'
    ? config.workMinutes * 60
    : phase === 'DESCANS_CURT'
      ? config.shortBreakMinutes * 60
      : config.longBreakMinutes * 60;

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  // Detecció de canvi de fase (so i sessió)
  useEffect(() => {
    if (phase !== previousPhase) {
      if (previousPhase === 'TREBALL' && soundEnabled) playChime();
      if (previousPhase === 'TREBALL') {
        // Fi d'un pomodoro → registra sessió
        addSession({
          userId: user?.uid || 'local',
          subjectId: currentSubjectId,
          taskId: currentTaskId,
          topicId: currentTopicId,
          type: 'POMODORO',
          startTime: new Date(Date.now() - config.workMinutes * 60 * 1000).toISOString(),
          endTime: new Date().toISOString(),
          durationMinutes: config.workMinutes,
          pomodorosCompleted: 1,
        });
        if (soundEnabled) playChime();
        toast.success(`🍅 Pomodoro completat! Total: ${pomodoroCount}`);
      }
      setPreviousPhase(phase);
    }
  }, [phase]);

  // So simple amb Web Audio API
  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio no disponible
    }
  };

  const pendingTasks = getPendingTasks();
  const todaySessions = sessions.filter(
    (s) => new Date(s.startTime).toDateString() === new Date().toDateString()
  );
  const todayPomodoros = todaySessions.filter((s) => s.type === 'POMODORO').length;
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const recentSessions = [...sessions].reverse().slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Pomodoro</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Tècnica de focus: {config.workMinutes}min treball / {config.shortBreakMinutes}min descans
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timer card */}
          <div
            className="card p-8 flex flex-col items-center gap-6 transition-colors duration-500"
            style={{ backgroundColor: PHASE_CONFIG[phase].bg }}
          >
            {/* Punts de progrés */}
            <PomodoroDots count={pomodoroCount} longBreakAfter={config.longBreakAfter} />

            {/* Cercle */}
            <CircleTimer
              timeLeft={timeLeft}
              total={phaseTotal}
              phase={phase}
              isRunning={isRunning}
            />

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Stop */}
              {(isRunning || isPaused) && (
                <button
                  onClick={() => { stop(); }}
                  className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-all"
                  title="Parar"
                >
                  <Square size={18} />
                </button>
              )}

              {/* Play/Pause principal */}
              <button
                onClick={() => {
                  if (!isRunning && !isPaused) start(currentSubjectId, currentTaskId);
                  else if (isRunning) pause();
                  else resume();
                }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
                style={{
                  backgroundColor: PHASE_CONFIG[phase].color,
                  boxShadow: `0 8px 32px ${PHASE_CONFIG[phase].color}50`,
                }}
              >
                {isRunning
                  ? <Pause size={28} />
                  : <Play size={28} className="ml-1" />
                }
              </button>

              {/* Skip */}
              {(isRunning || isPaused) && (
                <button
                  onClick={skipPhase}
                  className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-all"
                  title="Saltar fase"
                >
                  <SkipForward size={18} />
                </button>
              )}
            </div>

            {/* Sons i config */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                {soundEnabled ? 'So activat' : 'Silenci'}
              </button>
              <span className="text-[var(--border-default)]">·</span>
              <button
                onClick={() => setShowConfig((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <Settings size={13} />
                Configurar
              </button>
            </div>
          </div>

          {/* Config panel */}
          <AnimatePresence>
            {showConfig && <ConfigPanel onClose={() => setShowConfig(false)} />}
          </AnimatePresence>

          {/* Selector d'assignatura, tema i tasca */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Treballant a...
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Assignatura</label>
                <select
                  value={currentSubjectId || ''}
                  onChange={(e) => setSubject(e.target.value || undefined)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[oklch(58%_0.22_290)]"
                >
                  <option value="">Sense assignatura</option>
                  {subjects.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Tema (Opcional)</label>
                <select
                  value={currentTopicId || ''}
                  disabled={!currentSubjectId}
                  onChange={(e) => setTopic(e.target.value || undefined)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[oklch(58%_0.22_290)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Sense tema</option>
                  {currentSubjectId &&
                    subjects
                      .find((s) => s.id === currentSubjectId)
                      ?.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Tasca (Opcional)</label>
                <select
                  value={currentTaskId || ''}
                  onChange={(e) => setTask(e.target.value || undefined)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[oklch(58%_0.22_290)]"
                >
                  <option value="">Sense tasca</option>
                  {pendingTasks
                    .filter((t) => !currentSubjectId || t.subjectId === currentSubjectId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Columna dreta */}
        <div className="space-y-4">
          {/* Stats avui */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Avui</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span>🍅</span> Pomodoros
                </div>
                <span className="font-bold text-[var(--text-primary)]">{todayPomodoros}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Clock size={14} /> Temps total
                </div>
                <span className="font-bold text-[var(--text-primary)]">
                  {todayMinutes > 0 ? formatDuration(todayMinutes) : '0m'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Zap size={14} /> Sessió actual
                </div>
                <span className="font-bold text-[var(--text-primary)]">{pomodoroCount % config.longBreakAfter || 0}/{config.longBreakAfter}</span>
              </div>
            </div>
          </div>

          {/* Historial recent */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Historial recent
            </h3>
            {recentSessions.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">
                Cap sessió registrada. Inicia el teu primer Pomodoro! 🍅
              </p>
            ) : (
              <div className="space-y-1">
                {recentSessions.map((s) => (
                  <SessionHistoryItem key={s.id} session={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
