import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────
export type TaskPriority = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENT';
export type TaskStatus = 'PENDENT' | 'EN_PROGRES' | 'COMPLETADA' | 'ARXIVADA';

export interface Task {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;          // ISO string
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  completedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  BAIXA:  { label: 'Baixa',  color: '#22c55e', bg: '#22c55e20' },
  NORMAL: { label: 'Normal', color: '#3b82f6', bg: '#3b82f620' },
  ALTA:   { label: 'Alta',   color: '#f97316', bg: '#f9731620' },
  URGENT: { label: 'Urgent', color: '#ef4444', bg: '#ef444420' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string }> = {
  PENDENT:    { label: 'Pendent' },
  EN_PROGRES: { label: 'En progrés' },
  COMPLETADA: { label: 'Completada' },
  ARXIVADA:   { label: 'Arxivada' },
};

// ── Store ─────────────────────────────────────────────────────────────────────
interface TasksState {
  tasks: Task[];
  addTask: (userId: string, data: CreateTaskInput) => Task;
  updateTask: (id: string, data: Partial<CreateTaskInput>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  archiveTask: (id: string) => void;
  duplicateTask: (id: string, userId: string) => Task;
  getTaskById: (id: string) => Task | undefined;
  getActiveTasks: () => Task[];
  getTasksBySubject: (subjectId: string) => Task[];
  getPendingTasks: () => Task[];
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (userId, data) => {
        const task: Task = {
          ...data,
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId,
          tags: data.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      updateTask: (id, data) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      completeTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'COMPLETADA', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      archiveTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'ARXIVADA', archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      duplicateTask: (id, userId) => {
        const original = get().tasks.find((t) => t.id === id);
        if (!original) throw new Error('Tasca no trobada');
        const copy: Task = {
          ...original,
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: `${original.title} (còpia)`,
          status: 'PENDENT',
          completedAt: undefined,
          archivedAt: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId,
        };
        set((s) => ({ tasks: [...s.tasks, copy] }));
        return copy;
      },

      getTaskById: (id) => get().tasks.find((t) => t.id === id),

      getActiveTasks: () =>
        get().tasks.filter((t) => t.status !== 'ARXIVADA'),

      getTasksBySubject: (subjectId) =>
        get().tasks.filter((t) => t.subjectId === subjectId && t.status !== 'ARXIVADA'),

      getPendingTasks: () =>
        get().tasks.filter((t) => t.status === 'PENDENT' || t.status === 'EN_PROGRES'),
    }),
    { name: 'estudi360-tasks' }
  )
);
