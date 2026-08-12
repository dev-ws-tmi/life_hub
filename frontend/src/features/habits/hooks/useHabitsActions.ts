import { doc, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHabitsStore, type Habit, type LogStatus, type HabitGoal } from '@/shared/stores/useHabitsStore';

// Helper to remove undefined properties recursively or replace with null for Firestore
function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    newObj[key] = val === undefined ? null : cleanUndefined(val);
  });
  return newObj;
}

export function useHabitsActions() {
  const { user } = useAuth();
  const store = useHabitsStore();

  const getDocRefs = (subcollectionName: string, docId: string) => {
    if (!user?.uid) return null;
    const habitsDocRef = doc(db, 'users', user.uid, 'habits', 'data');
    const cSub = collection(habitsDocRef, subcollectionName);
    return doc(cSub, docId);
  };

  const addHabit = async (hData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isPaused' | 'order'>) => {
    const habit = store.addHabit(hData);
    
    const dRef = getDocRefs('habits', habit.id);
    if (dRef) {
      await setDoc(dRef, cleanUndefined(habit));
    }
    return habit;
  };

  const updateHabit = async (id: string, data: Partial<Habit>) => {
    store.updateHabit(id, data);
    
    const dRef = getDocRefs('habits', id);
    if (dRef) {
      await updateDoc(dRef, cleanUndefined({
        ...data,
        updatedAt: new Date().toISOString()
      }));
    }
  };

  const deleteHabit = async (id: string) => {
    store.deleteHabit(id);

    const dRef = getDocRefs('habits', id);
    if (dRef) {
      await deleteDoc(dRef);
    }
  };

  const logCheckIn = async (habitId: string, date: string, status: LogStatus, value: number, notes?: string) => {
    const log = store.logCheckIn(habitId, date, status, value, notes);
    
    const dRef = getDocRefs('habitLogs', log.id);
    if (dRef) {
      await setDoc(dRef, cleanUndefined(log));
    }

    if (user?.uid) {
      const habitsDocRef = doc(db, 'users', user.uid, 'habits', 'data');
      const cGoals = collection(habitsDocRef, 'habitGoals');
      store.goals.forEach(async (g) => {
        const goalRef = doc(cGoals, g.id);
        await setDoc(goalRef, cleanUndefined(g));
      });
    }
    return log;
  };

  const addGoal = async (gData: Omit<HabitGoal, 'id' | 'currentValue' | 'status'>) => {
    const goal = store.addGoal(gData);

    const dRef = getDocRefs('habitGoals', goal.id);
    if (dRef) {
      await setDoc(dRef, cleanUndefined(goal));
    }
    return goal;
  };

  const updateGoal = async (id: string, data: Partial<HabitGoal>) => {
    store.updateGoal(id, data);

    const dRef = getDocRefs('habitGoals', id);
    if (dRef) {
      await updateDoc(dRef, cleanUndefined(data));
    }
  };

  const deleteGoal = async (id: string) => {
    store.deleteGoal(id);

    const dRef = getDocRefs('habitGoals', id);
    if (dRef) {
      await deleteDoc(dRef);
    }
  };

  return {
    addHabit,
    updateHabit,
    deleteHabit,
    logCheckIn,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
