import { Timestamp } from 'firebase/firestore';

// ── Examen ────────────────────────────────────────────────────────────────────
export type ExamStatus = 'PENDENT' | 'COMPLETAT' | 'APROVAT' | 'SUSPES';
export type ExamDifficulty = 1 | 2 | 3 | 4 | 5;

export interface Exam {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  date: Timestamp;
  location?: string;
  weight: number;              // Percentatge sobre nota final (0-100)
  difficulty: ExamDifficulty;
  status: ExamStatus;
  grade?: number;              // 0-10 si completat
  notes?: string;
  studyHoursPlanned: number;
  studyHoursActual: number;
  importedFromIcal?: boolean;
  icalEventId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateExamInput = Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExamInput = Partial<Omit<Exam, 'id' | 'userId' | 'createdAt'>>;

// ── Nota Acadèmica ────────────────────────────────────────────────────────────
export type NoteType = 'EXAMEN' | 'TREBALL' | 'QUIZ' | 'PROJECTE' | 'PARTICIPACIO' | 'PRACTICA';

export interface AcademicNote {
  id: string;
  userId: string;
  subjectId: string;
  examId?: string;
  title: string;
  grade: number;             // Nota obtinguda
  maxGrade: number;          // Nota màxima possible
  weight: number;            // Pes en la nota final (0-100)
  date: Timestamp;
  type: NoteType;
  comments?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateNoteInput = Omit<AcademicNote, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNoteInput = Partial<Omit<AcademicNote, 'id' | 'userId' | 'createdAt'>>;
