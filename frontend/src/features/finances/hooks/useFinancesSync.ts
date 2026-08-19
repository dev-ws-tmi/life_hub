import { useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFinancesStore } from '@/shared/stores/useFinancesStore';

export function useFinancesSync() {
  const { user } = useAuth();
  const { setAllData, initializeDefaultData } = useFinancesStore();

  useEffect(() => {
    // If no logged in user, initialize with default local data
    if (!user?.uid) {
      initializeDefaultData();
      return;
    }

    const uid = user.uid;

    // Parent document for finances
    const financeDocRef = doc(db, 'users', uid, 'finance', 'data');

    // Subcollections references
    const cAccounts = collection(financeDocRef, 'accounts');
    const cTransactions = collection(financeDocRef, 'transactions');
    const cCategories = collection(financeDocRef, 'categories');
    const cBudgets = collection(financeDocRef, 'budgets');
    const cGoals = collection(financeDocRef, 'goals');
    const cSubscriptions = collection(financeDocRef, 'subscriptions');
    const cDebts = collection(financeDocRef, 'debts');
    const cRecurring = collection(financeDocRef, 'recurringPayments');

    let localAccounts: any[] = [];
    let localTransactions: any[] = [];
    let localCategories: any[] = [];
    let localBudgets: any[] = [];
    let localGoals: any[] = [];
    let localSubscriptions: any[] = [];
    let localDebts: any[] = [];
    let localRecurring: any[] = [];

    const syncToStore = () => {
      setAllData({
        accounts: localAccounts.length > 0 ? localAccounts : [],
        transactions: localTransactions,
        categories: localCategories.length > 0 ? localCategories : [],
        budgets: localBudgets,
        goals: localGoals,
        subscriptions: localSubscriptions,
        debts: localDebts,
        recurringPayments: localRecurring,
      });
    };

    const handleSyncError = (name: string) => (error: any) => {
      if (error.code === 'permission-denied') return;
      console.error(`Error syncing finances ${name}:`, error);
    };

    // Subscriptions to snapshots
    const unsubAccounts = onSnapshot(cAccounts, (snap) => {
      localAccounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, handleSyncError('accounts'));

    const unsubTransactions = onSnapshot(cTransactions, (snap) => {
      localTransactions = snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a, b) => b.date.localeCompare(a.date));
      syncToStore();
    }, handleSyncError('transactions'));

    const unsubCategories = onSnapshot(cCategories, (snap) => {
      localCategories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, handleSyncError('categories'));

    const unsubBudgets = onSnapshot(cBudgets, (snap) => {
      localBudgets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, handleSyncError('budgets'));

    const unsubGoals = onSnapshot(cGoals, (snap) => {
      localGoals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, handleSyncError('goals'));

    const unsubSubscriptions = onSnapshot(cSubscriptions, (snap) => {
      localSubscriptions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, handleSyncError('subscriptions'));

    const unsubDebts = onSnapshot(cDebts, (snap) => {
      localDebts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, handleSyncError('debts'));

    const unsubRecurring = onSnapshot(cRecurring, (snap) => {
      localRecurring = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, handleSyncError('recurring payments'));

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubCategories();
      unsubBudgets();
      unsubGoals();
      unsubSubscriptions();
      unsubDebts();
      unsubRecurring();
    };
  }, [user?.uid]);
}
