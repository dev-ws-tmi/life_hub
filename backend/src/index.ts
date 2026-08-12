import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v2';

// ── Inicialitza Firebase Admin ────────────────────────────────────────────────
admin.initializeApp();

// ── Re-exporta funcions ───────────────────────────────────────────────────────
export { onUserCreated } from './triggers/onUserCreated';
export { sendWeeklyReport } from './scheduled/weeklyReport';
