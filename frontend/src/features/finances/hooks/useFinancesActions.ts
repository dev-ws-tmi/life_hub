import { doc, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFinancesStore, type Transaction, type Account, type Budget, type Goal, type Subscription, type Debt, type Category } from '@/shared/stores/useFinancesStore';

export function useFinancesActions() {
  const { user } = useAuth();
  const store = useFinancesStore();

  const getDocRefs = (subcollectionName: string, docId: string) => {
    if (!user?.uid) return null;
    const financeDocRef = doc(db, 'users', user.uid, 'finance', 'data');
    const colRef = collection(financeDocRef, subcollectionName);
    const dRef = doc(colRef, docId);
    return { colRef, dRef };
  };

  // Accounts
  const addAccount = async (accData: Omit<Account, 'id' | 'createdAt'>) => {
    const acc = store.addAccount(accData);
    const refs = getDocRefs('accounts', acc.id);
    if (refs) {
      await setDoc(refs.dRef, { ...acc });
    }
    return acc;
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    store.updateAccount(id, data);
    const refs = getDocRefs('accounts', id);
    if (refs) {
      await updateDoc(refs.dRef, data);
    }
  };

  const deleteAccount = async (id: string) => {
    store.deleteAccount(id);
    const refs = getDocRefs('accounts', id);
    if (refs) {
      await deleteDoc(refs.dRef);
    }
  };

  // Transactions
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tx = store.addTransaction(txData);
    const refs = getDocRefs('transactions', tx.id);
    if (refs) {
      await setDoc(refs.dRef, { ...tx });
      
      // Update account balances on Firestore as well
      const acc = store.accounts.find(a => a.id === tx.accountId);
      if (acc) {
        const accRefs = getDocRefs('accounts', acc.id);
        if (accRefs) await updateDoc(accRefs.dRef, { balance: acc.balance });
      }

      if (tx.type === 'TRANSFER' && tx.destinationAccountId) {
        const destAcc = store.accounts.find(a => a.id === tx.destinationAccountId);
        if (destAcc) {
          const destRefs = getDocRefs('accounts', destAcc.id);
          if (destRefs) await updateDoc(destRefs.dRef, { balance: destAcc.balance });
        }
      }
    }
    return tx;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    store.updateTransaction(id, data);
    const refs = getDocRefs('transactions', id);
    if (refs) {
      await updateDoc(refs.dRef, data);

      // Sync account balances to Firestore
      for (const acc of store.accounts) {
        const accRefs = getDocRefs('accounts', acc.id);
        if (accRefs) await updateDoc(accRefs.dRef, { balance: acc.balance });
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    store.deleteTransaction(id);
    const refs = getDocRefs('transactions', id);
    if (refs) {
      await deleteDoc(refs.dRef);

      // Sync account balances to Firestore
      for (const acc of store.accounts) {
        const accRefs = getDocRefs('accounts', acc.id);
        if (accRefs) await updateDoc(accRefs.dRef, { balance: acc.balance });
      }
    }
  };

  // Budgets
  const addBudget = async (bData: Omit<Budget, 'id' | 'spent'>) => {
    const b = store.addBudget(bData);
    const refs = getDocRefs('budgets', b.id);
    if (refs) {
      await setDoc(refs.dRef, { ...b });
    }
    return b;
  };

  const updateBudget = async (id: string, data: Partial<Budget>) => {
    store.updateBudget(id, data);
    const refs = getDocRefs('budgets', id);
    if (refs) {
      await updateDoc(refs.dRef, data);
    }
  };

  // Goals
  const addGoal = async (gData: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => {
    const goal = store.addGoal(gData);
    const refs = getDocRefs('goals', goal.id);
    if (refs) {
      await setDoc(refs.dRef, { ...goal });
    }
    return goal;
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    store.updateGoal(id, data);
    const refs = getDocRefs('goals', id);
    if (refs) {
      await updateDoc(refs.dRef, data);
    }
  };

  const deleteGoal = async (id: string) => {
    store.deleteGoal(id);
    const refs = getDocRefs('goals', id);
    if (refs) {
      await deleteDoc(refs.dRef);
    }
  };

  const addGoalContribution = async (goalId: string, amount: number, notes?: string) => {
    store.addGoalContribution(goalId, amount, notes);
    const goal = store.goals.find(g => g.id === goalId);
    if (goal) {
      const refs = getDocRefs('goals', goalId);
      if (refs) {
        await updateDoc(refs.dRef, {
          contributions: goal.contributions,
          currentAmount: goal.currentAmount,
        });
      }
    }
  };

  // Subscriptions
  const addSubscription = async (sData: Omit<Subscription, 'id' | 'isActive'>) => {
    const sub = store.addSubscription(sData);
    const refs = getDocRefs('subscriptions', sub.id);
    if (refs) {
      await setDoc(refs.dRef, { ...sub });
    }
    return sub;
  };

  const updateSubscription = async (id: string, data: Partial<Subscription>) => {
    store.updateSubscription(id, data);
    const refs = getDocRefs('subscriptions', id);
    if (refs) {
      await updateDoc(refs.dRef, data);
    }
  };

  const deleteSubscription = async (id: string) => {
    store.deleteSubscription(id);
    const refs = getDocRefs('subscriptions', id);
    if (refs) {
      await deleteDoc(refs.dRef);
    }
  };

  // Debts
  const addDebt = async (dData: Omit<Debt, 'id' | 'payments' | 'status' | 'createdAt'>) => {
    const debt = store.addDebt(dData);
    const refs = getDocRefs('debts', debt.id);
    if (refs) {
      await setDoc(refs.dRef, { ...debt });
    }
    return debt;
  };

  const updateDebt = async (id: string, data: Partial<Debt>) => {
    store.updateDebt(id, data);
    const refs = getDocRefs('debts', id);
    if (refs) {
      await updateDoc(refs.dRef, data);
    }
  };

  const deleteDebt = async (id: string) => {
    store.deleteDebt(id);
    const refs = getDocRefs('debts', id);
    if (refs) {
      await deleteDoc(refs.dRef);
    }
  };

  const addDebtPayment = async (debtId: string, amount: number) => {
    store.addDebtPayment(debtId, amount);
    const debt = store.debts.find(d => d.id === debtId);
    if (debt) {
      const refs = getDocRefs('debts', debtId);
      if (refs) {
        await updateDoc(refs.dRef, {
          payments: debt.payments,
          status: debt.status,
        });
      }
    }
  };

  // Categories
  const addCategory = async (catData: Omit<Category, 'id'>) => {
    const cat = store.addCategory(catData);
    const refs = getDocRefs('categories', cat.id);
    if (refs) {
      await setDoc(refs.dRef, { ...cat });
    }
    return cat;
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    store.updateCategory(id, data);
    const refs = getDocRefs('categories', id);
    if (refs) {
      await updateDoc(refs.dRef, data);
    }
  };

  return {
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalContribution,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    addDebt,
    updateDebt,
    deleteDebt,
    addDebtPayment,
    addCategory,
    updateCategory,
  };
}
