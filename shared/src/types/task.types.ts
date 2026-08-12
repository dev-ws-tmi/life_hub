import { Timestamp } from 'firebase/firestore';

// ── Tasca ─────────────────────────────────────────────────────────────────────
export type TaskPriority = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENT';
export type TaskStatus = 'PENDENT' | 'EN_PROGRES' | 'COMPLETADA' | 'ARXIVADA';

export interface TaskComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  size: number;
  mimeType: string;
  uploadedAt: Timestamp;
}

export interface Task {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Timestamp;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  completedAt?: Timestamp;
  archivedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'attachments' | 'comments'>;
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>;
