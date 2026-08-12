import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HabitGoalType = 'BINARY' | 'QUANTITY' | 'DURATION' | 'COUNTER' | 'VALUE';
export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIFIC_DAYS' | 'INTERVAL' | 'WEEKENDS' | 'WORKDAYS';
export type LogStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
export type GoalStatus = 'ACTIVE' | 'ACHIEVED';

export interface Habit {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  categoryId: string;
  goalType: HabitGoalType;
  goalValue: number;
  unit: string;
  frequency: HabitFrequency;
  daysOfWeek: number[]; // 0 (Sunday) to 6 (Saturday)
  frequencyInterval?: number | null; // Every X days
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  reminders: string[]; // HH:MM
  notificationsEnabled: boolean;
  isArchived: boolean;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
  order: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  tags: string[];
  notes?: string;
}

export interface HabitLog {
  id: string; // {habitId}_{date}
  habitId: string;
  date: string; // YYYY-MM-DD
  status: LogStatus;
  value: number; // for logged values (ml, flexions, minutes)
  notes?: string;
  photoUrl?: string | null;
  updatedAt: string;
}

export interface HabitGoal {
  id: string;
  title: string;
  habitId: string; // 'GLOBAL' or specific habitId
  type: 'TOTAL_COUNT' | 'STREAK_RECORD' | 'DURATION_TOTAL';
  targetValue: number;
  currentValue: number;
  status: GoalStatus;
  deadline?: string | null;
}

export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ── Default Categories ────────────────────────────────────────────────────────

export const DEFAULT_HABIT_CATEGORIES: HabitCategory[] = [
  { id: 'cat_study', name: 'Estudi i Treball', color: '#3b82f6', icon: 'BookOpen' },
  { id: 'cat_health', name: 'Salut', color: '#10b981', icon: 'Heart' },
  { id: 'cat_sport', name: 'Esport i Fitness', color: '#ef4444', icon: 'Flame' },
  { id: 'cat_house', name: 'Llar i Ordre', color: '#f59e0b', icon: 'Home' },
  { id: 'cat_mind', name: 'Ment i Relax', color: '#8b5cf6', icon: 'Brain' },
  { id: 'cat_nutrition', name: 'Alimentació', color: '#ec4899', icon: 'Apple' },
];

// ── Default Templates ─────────────────────────────────────────────────────────

export interface HabitTemplate {
  title: string;
  description: string;
  icon: string;
  color: string;
  categoryId: string;
  goalType: HabitGoalType;
  goalValue: number;
  unit: string;
  frequency: HabitFrequency;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    title: 'Beure Aigua',
    description: 'Mantenir-se hidratat durant el dia.',
    icon: 'Droplet',
    color: '#0ea5e9',
    categoryId: 'cat_health',
    goalType: 'QUANTITY',
    goalValue: 2000,
    unit: 'ml',
    frequency: 'DAILY',
    difficulty: 'EASY',
    estimatedMinutes: 5,
  },
  {
    title: 'Estudiar Diàriament',
    description: 'Dedicar temps enfocat a l\'aprenentatge.',
    icon: 'BookOpen',
    color: '#3b82f6',
    categoryId: 'cat_study',
    goalType: 'DURATION',
    goalValue: 60,
    unit: 'minuts',
    frequency: 'DAILY',
    difficulty: 'HARD',
    estimatedMinutes: 60,
  },
  {
    title: 'Meditar',
    description: 'Relaxar la ment i reduir l\'estrès.',
    icon: 'Brain',
    color: '#8b5cf6',
    categoryId: 'cat_mind',
    goalType: 'DURATION',
    goalValue: 10,
    unit: 'minuts',
    frequency: 'DAILY',
    difficulty: 'EASY',
    estimatedMinutes: 10,
  },
  {
    title: 'Rutina d\'Exercici',
    description: 'Mantenir el cos actiu i en forma.',
    icon: 'Activity',
    color: '#ef4444',
    categoryId: 'cat_sport',
    goalType: 'BINARY',
    goalValue: 1,
    unit: 'vegada',
    frequency: 'SPECIFIC_DAYS',
    difficulty: 'MEDIUM',
    estimatedMinutes: 45,
  },
  {
    title: 'Llegir un Llibre',
    description: 'Llegir unes pàgines abans d\'anar a dormir.',
    icon: 'BookOpen',
    color: '#ec4899',
    categoryId: 'cat_mind',
    goalType: 'QUANTITY',
    goalValue: 10,
    unit: 'pàgines',
    frequency: 'DAILY',
    difficulty: 'EASY',
    estimatedMinutes: 15,
  },
  {
    title: 'Fer el llit',
    description: 'Començar el dia amb un ordre bàsic.',
    icon: 'Home',
    color: '#f59e0b',
    categoryId: 'cat_house',
    goalType: 'BINARY',
    goalValue: 1,
    unit: 'vegada',
    frequency: 'DAILY',
    difficulty: 'EASY',
    estimatedMinutes: 2,
  }
];

// ── Zustand Store State Interface ─────────────────────────────────────────────

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  categories: HabitCategory[];
  goals: HabitGoal[];
  initialized: boolean;

  // Actions
  initializeDefaultData: () => void;
  setAllData: (data: Partial<Omit<HabitsState, 'initialized' | 'initializeDefaultData' | 'setAllData'>>) => void;
  
  // Habit Actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isPaused' | 'order'>) => Habit;
  updateHabit: (id: string, data: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;

  // Log Actions
  logCheckIn: (habitId: string, date: string, status: LogStatus, value: number, notes?: string) => HabitLog;
  
  // Goal Actions
  addGoal: (goal: Omit<HabitGoal, 'id' | 'currentValue' | 'status'>) => HabitGoal;
  updateGoal: (id: string, data: Partial<HabitGoal>) => void;
  deleteGoal: (id: string) => void;
}

// ── Streaks & Prediction Helper Functions ─────────────────────────────────────

export function calculateStreak(logs: HabitLog[], habitId: string): { current: number; longest: number } {
  const hLogs = logs
    .filter(l => l.habitId === habitId && l.status === 'COMPLETED')
    .map(l => l.date)
    .sort();

  if (hLogs.length === 0) return { current: 0, longest: 0 };

  // Calculate longest streak
  let longest = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  hLogs.forEach((dateStr) => {
    const d = new Date(dateStr);
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffTime = d.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays <= 1.1) { // consecutive days (allowing timezone/float minor variance)
        currentRun++;
      } else {
        if (currentRun > longest) longest = currentRun;
        currentRun = 1;
      }
    }
    prevDate = d;
  });
  if (currentRun > longest) longest = currentRun;

  // Calculate current active streak
  let current = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const hasCompletedToday = hLogs.includes(todayStr);
  const hasCompletedYesterday = hLogs.includes(yesterdayStr);

  if (hasCompletedToday || hasCompletedYesterday) {
    let checkDate = hasCompletedToday ? new Date(todayStr) : new Date(yesterdayStr);
    current = 0;
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (hLogs.includes(checkStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

// ── Store Implementation ──────────────────────────────────────────────────────

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      categories: [],
      goals: [],
      initialized: false,

      initializeDefaultData: () => {
        if (get().initialized) return;
        set({
          categories: DEFAULT_HABIT_CATEGORIES,
          initialized: true,
        });
      },

      setAllData: (data) => {
        set({ ...data, initialized: true });
      },

      // Habits
      addHabit: (hData) => {
        const id = `hab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const habit: Habit = {
          ...hData,
          id,
          isArchived: false,
          isPaused: false,
          order: get().habits.length,
          createdAt: now,
          updatedAt: now,
        };
        set(s => ({ habits: [...s.habits, habit] }));
        return habit;
      },

      updateHabit: (id, data) => {
        set(s => ({
          habits: s.habits.map(h => h.id === id ? { ...h, ...data, updatedAt: new Date().toISOString() } : h)
        }));
      },

      deleteHabit: (id) => {
        set(s => ({
          habits: s.habits.filter(h => h.id !== id),
          logs: s.logs.filter(l => l.habitId !== id)
        }));
      },

      // Check-ins (Logs)
      logCheckIn: (habitId, date, status, value, notes) => {
        const logId = `${habitId}_${date}`;
        const log: HabitLog = {
          id: logId,
          habitId,
          date,
          status,
          value,
          notes,
          photoUrl: null,
          updatedAt: new Date().toISOString(),
        };

        set(s => {
          const filtered = s.logs.filter(l => l.id !== logId);
          return { logs: [...filtered, log] };
        });

        // Update Goals if linked
        set(s => {
          const updatedGoals = s.goals.map(g => {
            if (g.habitId === habitId || g.habitId === 'GLOBAL') {
              let currentVal = g.currentValue;
              
              if (g.type === 'TOTAL_COUNT' && status === 'COMPLETED') {
                // Recompute total count of completed logs for this habit
                currentVal = s.logs.filter(l => l.habitId === habitId && l.status === 'COMPLETED').length + (status === 'COMPLETED' ? 1 : 0);
              } else if (g.type === 'STREAK_RECORD') {
                const streak = calculateStreak(s.logs, habitId);
                currentVal = streak.longest;
              } else if (g.type === 'DURATION_TOTAL' && status === 'COMPLETED') {
                currentVal = s.logs.filter(l => l.habitId === habitId && l.status === 'COMPLETED').reduce((sum, l) => sum + l.value, 0) + (status === 'COMPLETED' ? value : 0);
              }

              const goalAchieved = currentVal >= g.targetValue;
              return {
                ...g,
                currentValue: currentVal,
                status: goalAchieved ? 'ACHIEVED' as const : 'ACTIVE' as const
              };
            }
            return g;
          });
          return { goals: updatedGoals };
        });

        return log;
      },

      // Goals
      addGoal: (gData) => {
        const id = `hgoal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const goal: HabitGoal = {
          ...gData,
          id,
          currentValue: 0,
          status: 'ACTIVE',
        };
        set(s => ({ goals: [...s.goals, goal] }));
        return goal;
      },

      updateGoal: (id, data) => {
        set(s => ({
          goals: s.goals.map(g => g.id === id ? { ...g, ...data } : g)
        }));
      },

      deleteGoal: (id) => {
        set(s => ({
          goals: s.goals.filter(g => g.id !== id)
        }));
      },
    }),
    { name: 'estudi360-habits' }
  )
);
