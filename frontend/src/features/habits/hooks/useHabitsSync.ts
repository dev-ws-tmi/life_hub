import { useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHabitsStore } from '@/shared/stores/useHabitsStore';

export function useHabitsSync() {
  const { user } = useAuth();
  const { setAllData, initializeDefaultData } = useHabitsStore();

  useEffect(() => {
    if (!user?.uid) {
      initializeDefaultData();
      return;
    }

    const uid = user.uid;
    const habitsDocRef = doc(db, 'users', uid, 'habits', 'data');

    const cHabits = collection(habitsDocRef, 'habits');
    const cLogs = collection(habitsDocRef, 'habitLogs');
    const cGoals = collection(habitsDocRef, 'habitGoals');

    let localHabits: any[] = [];
    let localLogs: any[] = [];
    let localGoals: any[] = [];

    const syncToStore = () => {
      setAllData({
        habits: localHabits,
        logs: localLogs,
        goals: localGoals,
      });
    };

    const handleSyncError = (name: string) => (error: any) => {
      if (error.code === 'permission-denied') return;
      console.error(`Error syncing habits ${name}:`, error);
    };

    const unsubHabits = onSnapshot(cHabits, (snap) => {
      localHabits = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      syncToStore();
    }, handleSyncError('list'));

    const unsubLogs = onSnapshot(cLogs, (snap) => {
      localLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      syncToStore();
    }, handleSyncError('logs'));

    const unsubGoals = onSnapshot(cGoals, (snap) => {
      localGoals = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      syncToStore();
    }, handleSyncError('goals'));

    return () => {
      unsubHabits();
      unsubLogs();
      unsubGoals();
    };
  }, [user?.uid]);
}
