import * as admin from 'firebase-admin';
import { auth } from 'firebase-functions/v2';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

/**
 * Trigger: Quan un usuari es crea a Firebase Auth,
 * crea automàticament el seu perfil a Firestore.
 */
export const onUserCreated = auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  const userProfile = {
    uid,
    email: email || '',
    displayName: displayName || 'Estudiant',
    photoURL: photoURL || null,
    role: 'USER',
    plan: 'FREE',
    weeklyStudyHours: 0,
    weeklyObjective: 20,
    theme: 'system',
    language: 'ca',
    notifications: {
      push: true,
      email: true,
      inApp: true,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
  };

  try {
    await db.collection('users').doc(uid).set(userProfile, { merge: true });

    // Registra l'audit log
    await db.collection('auditLogs').add({
      userId: uid,
      action: 'REGISTER',
      entity: 'users',
      entityId: uid,
      newData: { email, displayName },
      timestamp: Timestamp.now(),
    });

    console.info(`✅ Perfil creat per a l'usuari: ${uid}`);
  } catch (error) {
    console.error(`❌ Error creant perfil per ${uid}:`, error);
    throw error;
  }
});
