import { Timestamp } from 'firebase/firestore';

// ── Sessió d'Estudi ───────────────────────────────────────────────────────────
export type SessionType = 'POMODORO' | 'LLIURE' | 'PLANIFICADA';

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  taskId?: string;
  type: SessionType;
  startTime: Timestamp;
  endTime: Timestamp;
  durationMinutes: number;
  pomodorosCompleted?: number;
  notes?: string;
  createdAt: Timestamp;
}

export type CreateSessionInput = Omit<StudySession, 'id' | 'createdAt'>;

// ── Notificació ───────────────────────────────────────────────────────────────
export type NotificationType =
  | 'RECORDATORI_EXAMEN'
  | 'TASCA_VENCIMENT'
  | 'INFORME_SETMANAL'
  | 'RECOMANACIO'
  | 'SISTEMA';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: Timestamp;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'REGISTER'
  | 'TASCA_CREAR' | 'TASCA_EDITAR' | 'TASCA_ELIMINAR' | 'TASCA_COMPLETAR'
  | 'ASSIGNATURA_CREAR' | 'ASSIGNATURA_EDITAR' | 'ASSIGNATURA_ELIMINAR'
  | 'EXAMEN_CREAR' | 'EXAMEN_EDITAR' | 'EXAMEN_ELIMINAR'
  | 'NOTA_CREAR' | 'NOTA_EDITAR' | 'NOTA_ELIMINAR'
  | 'SESSIO_INICIAR' | 'SESSIO_FINALITZAR'
  | 'CONFIGURACIO_CANVI'
  | 'PERFIL_ACTUALITZAR';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

export type CreateAuditLogInput = Omit<AuditLog, 'id'>;
