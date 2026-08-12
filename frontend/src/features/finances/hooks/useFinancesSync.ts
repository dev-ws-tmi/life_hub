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

    // Subscriptions to snapshots
    const unsubAccounts = onSnapshot(cAccounts, (snap) => {
      localAccounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, (err) => console.error("Error syncing finances accounts:", err));

    const unsubTransactions = onSnapshot(cTransactions, (snap) => {
      localTransactions = snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a, b) => b.date.localeCompare(a.date));
      syncToStore();
    }, (err) => console.error("Error syncing finances transactions:", err));

    const unsubCategories = onSnapshot(cCategories, (snap) => {
      localCategories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, (err) => console.error("Error syncing finances categories:", err));

    const unsubBudgets = onSnapshot(cBudgets, (snap) => {
      localBudgets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, (err) => console.error("Error syncing finances budgets:", err));

    const unsubGoals = onSnapshot(cGoals, (snap) => {
      localGoals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, (err) => console.error("Error syncing finances goals:", err));

    const unsubSubscriptions = onSnapshot(cSubscriptions, (snap) => {
      localSubscriptions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, (err) => console.error("Error syncing finances subscriptions:", err));

    const unsubDebts = onSnapshot(cDebts, (snap) => {
      localDebts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, (err) => console.error("Error syncing finances debts:", err));

    const unsubRecurring = onSnapshot(cRecurring, (snap) => {
      localRecurring = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncToStore();
    }, (err) => console.error("Error syncing finances recurring payments:", err));

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
