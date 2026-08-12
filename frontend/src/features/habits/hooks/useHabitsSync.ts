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

    const unsubHabits = onSnapshot(cHabits, (snap) => {
      localHabits = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      syncToStore();
    }, (err) => console.error("Error syncing habits list:", err));

    const unsubLogs = onSnapshot(cLogs, (snap) => {
      localLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      syncToStore();
    }, (err) => console.error("Error syncing habits logs:", err));

    const unsubGoals = onSnapshot(cGoals, (snap) => {
      localGoals = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      syncToStore();
    }, (err) => console.error("Error syncing habits goals:", err));

    return () => {
      unsubHabits();
      unsubLogs();
      unsubGoals();
    };
  }, [user?.uid]);
}
