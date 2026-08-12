import * as admin from 'firebase-admin';
import { scheduler } from 'firebase-functions/v2';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

/**
 * Funció programada: Envia l'informe setmanal a tots els usuaris actius.
 * S'executa cada dilluns a les 8:00 AM (hora de Madrid).
 */
export const sendWeeklyReport = scheduler.onSchedule(
  {
    schedule: 'every monday 08:00',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
  },
  async () => {
    console.info('📊 Iniciant generació d\'informes setmanals...');

    try {
      // Obté tots els usuaris amb notificacions activades
      const usersSnap = await db
        .collection('users')
        .where('notifications.inApp', '==', true)
        .get();

      const batch = db.batch();
      let count = 0;

      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;

        // Crea notificació in-app
        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
          userId,
          type: 'INFORME_SETMANAL',
          title: 'Informe setmanal disponible',
          message: 'El teu informe de la setmana passada ja està disponible. Revisa el teu progrés!',
          read: false,
          actionUrl: '/estadistiques',
          createdAt: Timestamp.now(),
        });
        count++;
      }

      await batch.commit();
      console.info(`✅ ${count} informes setmanals generats`);
    } catch (error) {
      console.error('❌ Error generant informes setmanals:', error);
      throw error;
    }
  }
);
