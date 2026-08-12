import { Timestamp } from 'firebase/firestore';

// ── Assignatura ───────────────────────────────────────────────────────────────
export type SubjectColor =
  | '#6366f1' | '#8b5cf6' | '#ec4899' | '#f43f5e'
  | '#f97316' | '#eab308' | '#22c55e' | '#14b8a6'
  | '#3b82f6' | '#06b6d4';

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  credits: number;
  professor?: string;
  color: SubjectColor;
  semester: string;           // Ex: "2024-25 S2"
  academicYear: string;       // Ex: "2024-25"
  currentGrade?: number;      // 0-10
  targetGrade: number;        // 0-10
  weeklyHoursObjective?: number;
  isActive: boolean;
  schedule?: SubjectSchedule[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubjectSchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  classroom?: string;
}

export type CreateSubjectInput = Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSubjectInput = Partial<Omit<Subject, 'id' | 'userId' | 'createdAt'>>;
