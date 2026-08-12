import { Timestamp } from 'firebase/firestore';

// ── Roles i Plans ─────────────────────────────────────────────────────────────
export type UserRole = 'USER' | 'PREMIUM' | 'ADMIN' | 'SUPER_ADMIN';
export type UserPlan = 'FREE' | 'PREMIUM' | 'PRO';

// ── Usuari ────────────────────────────────────────────────────────────────────
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  plan: UserPlan;
  university?: string;
  degree?: string;
  weeklyStudyHours: number;
  weeklyObjective: number;
  theme: 'light' | 'dark' | 'system';
  language: 'ca' | 'es' | 'en';
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  stripe?: {
    customerId: string;
    subscriptionId: string;
    plan: UserPlan;
    renewalDate: Timestamp;
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  };
  fcmTokens?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

export type CreateUserInput = Omit<User, 'uid' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;
export type UpdateUserInput = Partial<Omit<User, 'uid' | 'email' | 'createdAt' | 'role' | 'plan'>>;
