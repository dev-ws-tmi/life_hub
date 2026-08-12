import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PomodoroConfig {
  workMinutes: number;      // Defecte: 25
  shortBreakMinutes: number; // Defecte: 5
  longBreakMinutes: number;  // Defecte: 15
  longBreakAfter: number;    // Pomodoros abans del descans llarg
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export type PomodoroPhase = 'TREBALL' | 'DESCANS_CURT' | 'DESCANS_LLARG';

export interface PomodoroState {
  config: PomodoroConfig;
  phase: PomodoroPhase;
  timeLeft: number;          // Segons restants
  isRunning: boolean;
  isPaused: boolean;
  pomodoroCount: number;     // Completats en la sessió actual
  currentSubjectId?: string;
  currentTopicId?: string;
  currentActivityId?: string;
  currentTaskId?: string;
  sessionStartTime?: string;

  // Accions de config
  setConfig: (config: Partial<PomodoroConfig>) => void;

  // Accions del timer
  start: (subjectId?: string, taskId?: string, topicId?: string, activityId?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
  completePomodoro: () => void;
  skipPhase: () => void;
  setSubject: (subjectId?: string) => void;
  setTopic: (topicId?: string) => void;
  setActivity: (activityId?: string) => void;
  setTask: (taskId?: string) => void;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakAfter: 4,
  autoStartBreaks: false,
  autoStartWork: false,
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      phase: 'TREBALL',
      timeLeft: DEFAULT_CONFIG.workMinutes * 60,
      isRunning: false,
      isPaused: false,
      pomodoroCount: 0,
      currentSubjectId: undefined,
      currentTopicId: undefined,
      currentActivityId: undefined,
      currentTaskId: undefined,
      sessionStartTime: undefined,

      setConfig: (config) => {
        set((s) => {
          const newConfig = { ...s.config, ...config };
          // Si no estem en marxa, actualitza el timeLeft
          const timeLeft = !s.isRunning
            ? newConfig.workMinutes * 60
            : s.timeLeft;
          return { config: newConfig, timeLeft };
        });
      },

      start: (subjectId, taskId, topicId, activityId) => {
        const { config } = get();
        set({
          isRunning: true,
          isPaused: false,
          timeLeft: config.workMinutes * 60,
          phase: 'TREBALL',
          currentSubjectId: subjectId,
          currentTaskId: taskId,
          currentTopicId: topicId,
          currentActivityId: activityId,
          sessionStartTime: new Date().toISOString(),
        });
      },

      pause: () => set({ isRunning: false, isPaused: true }),

      resume: () => set({ isRunning: true, isPaused: false }),

      stop: () => {
        const { config } = get();
        set({
          isRunning: false,
          isPaused: false,
          phase: 'TREBALL',
          timeLeft: config.workMinutes * 60,
          sessionStartTime: undefined,
        });
      },

      tick: () => {
        const { timeLeft } = get();
        if (timeLeft > 0) {
          set({ timeLeft: timeLeft - 1 });
        } else {
          get().completePomodoro();
        }
      },

      completePomodoro: () => {
        const { config, pomodoroCount, phase } = get();
        if (phase === 'TREBALL') {
          const newCount = pomodoroCount + 1;
          const isLongBreak = newCount % config.longBreakAfter === 0;
          const nextPhase: PomodoroPhase = isLongBreak ? 'DESCANS_LLARG' : 'DESCANS_CURT';
          const breakTime = isLongBreak
            ? config.longBreakMinutes * 60
            : config.shortBreakMinutes * 60;

          set({
            pomodoroCount: newCount,
            phase: nextPhase,
            timeLeft: breakTime,
            isRunning: config.autoStartBreaks,
            isPaused: !config.autoStartBreaks,
          });
        } else {
          // Fi del descans → torna al treball
          set({
            phase: 'TREBALL',
            timeLeft: config.workMinutes * 60,
            isRunning: config.autoStartWork,
            isPaused: !config.autoStartWork,
          });
        }
      },

      skipPhase: () => {
        get().completePomodoro();
      },

      setSubject: (subjectId) => set({ currentSubjectId: subjectId, currentTopicId: undefined, currentActivityId: undefined }),
      setTopic: (topicId) => set({ currentTopicId: topicId, currentActivityId: undefined }),
      setActivity: (activityId) => set({ currentActivityId: activityId }),
      setTask: (taskId) => set({ currentTaskId: taskId }),
    }),
    {
      name: 'estudi360-pomodoro',
      partialize: (s) => ({ config: s.config, pomodoroCount: s.pomodoroCount }),
    }
  )
);
