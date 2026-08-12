import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────
export type SessionType = 'POMODORO' | 'LLIURE' | 'PLANIFICADA';

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  topicId?: string;
  activityId?: string;
  taskId?: string;
  type: SessionType;
  startTime: string;    // ISO string
  endTime: string;      // ISO string
  durationMinutes: number;
  pomodorosCompleted?: number;
  notes?: string;
  createdAt: string;
}

export type CreateSessionInput = Omit<StudySession, 'id' | 'createdAt'>;

// ── Store ─────────────────────────────────────────────────────────────────────
interface SessionsState {
  sessions: StudySession[];
  addSession: (data: CreateSessionInput) => StudySession;
  deleteSession: (id: string) => void;
  getSessionsToday: () => StudySession[];
  getSessionsThisWeek: () => StudySession[];
  getTotalMinutesToday: () => number;
  getTotalMinutesThisWeek: () => number;
  getMinutesBySubject: (subjectId: string, days?: number) => number;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // dilluns
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (data) => {
        const session: StudySession = {
          ...data,
          id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session;
      },

      deleteSession: (id) => {
        set((s) => ({ sessions: s.sessions.filter((s) => s.id !== id) }));
      },

      getSessionsToday: () => {
        const todayStart = startOfDay(new Date());
        return get().sessions.filter(
          (s) => new Date(s.startTime) >= todayStart
        );
      },

      getSessionsThisWeek: () => {
        const weekStart = startOfWeek(new Date());
        return get().sessions.filter(
          (s) => new Date(s.startTime) >= weekStart
        );
      },

      getTotalMinutesToday: () =>
        get().getSessionsToday().reduce((sum, s) => sum + s.durationMinutes, 0),

      getTotalMinutesThisWeek: () =>
        get().getSessionsThisWeek().reduce((sum, s) => sum + s.durationMinutes, 0),

      getMinutesBySubject: (subjectId, days = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().sessions
          .filter((s) => s.subjectId === subjectId && new Date(s.startTime) >= cutoff)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },
    }),
    { name: 'estudi360-sessions' }
  )
);
