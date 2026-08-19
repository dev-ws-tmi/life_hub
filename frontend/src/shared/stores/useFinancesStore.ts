import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AccountType = 'BANK' | 'CASH' | 'BIZUM' | 'PAYPAL' | 'SAVINGS' | 'BUSINESS';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'REFUND' | 'INTERNAL';
export type PeriodType = 'MONTHLY';
export type DebtType = 'DEBT_TO_USER' | 'USER_DEBT';
export type DebtStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  balance: number;
  currency: string;
  type: AccountType;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  order: number;
}

export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number; // positive for income, negative for expense
  date: string; // YYYY-MM-DD
  categoryId: string;
  accountId: string;
  destinationAccountId?: string; // used for transfer
  type: TransactionType;
  attachments?: string[];
  location?: { latitude: number; longitude: number; name: string } | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  important?: boolean;
  favorite?: boolean;
  recurringId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string;
  icon: string;
  monthlyLimit: number | null;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  period: PeriodType;
  year: number;
  month: number; // 1-12
}

export interface GoalContribution {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  color: string;
  icon: string;
  contributions: GoalContribution[];
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  nextBillingDate: string; // YYYY-MM-DD
  accountId: string;
  categoryId: string;
  isActive: boolean;
}

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
}

export interface Debt {
  id: string;
  title: string;
  amount: number;
  interestRate?: number; // percentage
  payments: DebtPayment[];
  type: DebtType;
  status: DebtStatus;
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface RecurringPayment {
  id: string;
  title: string;
  amount: number;
  frequencyDays: number;
  nextDate: string; // YYYY-MM-DD
  accountId: string;
  categoryId: string;
}

// ── Default Categories & Accounts ─────────────────────────────────────────────

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_housing', name: 'Habitatge', color: '#3b82f6', emoji: '🏠', icon: 'Home', monthlyLimit: 600 },
  { id: 'cat_food', name: 'Menjar i Supermercat', color: '#10b981', emoji: '🛒', icon: 'ShoppingCart', monthlyLimit: 250 },
  { id: 'cat_transport', name: 'Transport i Gasolina', color: '#f59e0b', emoji: '🚗', icon: 'Car', monthlyLimit: 100 },
  { id: 'cat_subscriptions', name: 'Subscripcions i Serveis', color: '#8b5cf6', emoji: '📱', icon: 'Tv', monthlyLimit: 50 },
  { id: 'cat_leisure', name: 'Oci i Restaurants', color: '#ec4899', emoji: '🎉', icon: 'Beer', monthlyLimit: 120 },
  { id: 'cat_studies', name: 'Estudis i Formació', color: '#0ea5e9', emoji: '📚', icon: 'BookOpen', monthlyLimit: 80 },
  { id: 'cat_health', name: 'Salut i Esport', color: '#ef4444', emoji: '💪', icon: 'Heart', monthlyLimit: 60 },
  { id: 'cat_shopping', name: 'Roba i Compres', color: '#f43f5e', emoji: '🛍️', icon: 'ShoppingBag', monthlyLimit: 100 },
  { id: 'cat_salary', name: 'Nomina i Ingressos', color: '#22c55e', emoji: '💼', icon: 'Briefcase', monthlyLimit: null },
  { id: 'cat_others', name: 'Altres despeses', color: '#64748b', emoji: '📦', icon: 'FolderPlus', monthlyLimit: null },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_bank',
    name: 'Compte Principal',
    icon: 'Landmark',
    color: '#3b82f6',
    balance: 0,
    currency: 'EUR',
    type: 'BANK',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    order: 0,
  },
  {
    id: 'acc_cash',
    name: 'Efectiu',
    icon: 'Coins',
    color: '#10b981',
    balance: 0,
    currency: 'EUR',
    type: 'CASH',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    order: 1,
  },
  {
    id: 'acc_bizum',
    name: 'Bizum',
    icon: 'Smartphone',
    color: '#ff7a59',
    balance: 0,
    currency: 'EUR',
    type: 'BIZUM',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    order: 2,
  }
];

// ── Zustand Store State Interface ─────────────────────────────────────────────

interface FinancesState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  subscriptions: Subscription[];
  debts: Debt[];
  recurringPayments: RecurringPayment[];
  initialized: boolean;

  // Actions
  initializeDefaultData: () => void;
  setAllData: (data: Partial<Omit<FinancesState, 'initialized' | 'initializeDefaultData' | 'setAllData'>>) => void;
  
  // Account Actions
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Account;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Transaction Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;

  // Budget Actions
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => Budget;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  recalculateBudgets: () => void;

  // Goal Actions
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => Goal;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalContribution: (goalId: string, amount: number, notes?: string) => void;

  // Subscription Actions
  addSubscription: (sub: Omit<Subscription, 'id' | 'isActive'>) => Subscription;
  updateSubscription: (id: string, data: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;

  // Debt Actions
  addDebt: (debt: Omit<Debt, 'id' | 'payments' | 'status' | 'createdAt'>) => Debt;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (debtId: string, amount: number) => void;

  // Recurring Actions
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => RecurringPayment;
  updateRecurringPayment: (id: string, data: Partial<RecurringPayment>) => void;
  deleteRecurringPayment: (id: string) => void;
}

// ── Store Implementation ──────────────────────────────────────────────────────

export const useFinancesStore = create<FinancesState>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      subscriptions: [],
      debts: [],
      recurringPayments: [],
      initialized: false,

      initializeDefaultData: () => {
        if (get().initialized) return;
        set({
          accounts: DEFAULT_ACCOUNTS,
          categories: DEFAULT_CATEGORIES,
          initialized: true,
        });
      },

      setAllData: (data) => {
        set({ ...data, initialized: true });
      },

      // Accounts
      addAccount: (accData) => {
        const id = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const account: Account = {
          ...accData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ accounts: [...s.accounts, account] }));
        return account;
      },

      updateAccount: (id, data) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          transactions: s.transactions.filter((t) => t.accountId !== id && t.destinationAccountId !== id),
        }));
      },

      // Transactions
      addTransaction: (txData) => {
        const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const transaction: Transaction = {
          ...txData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        // Adjust balances
        set((s) => {
          const accounts = s.accounts.map((acc) => {
            if (acc.id === txData.accountId) {
              return { ...acc, balance: acc.balance + txData.amount };
            }
            if (txData.type === 'TRANSFER' && acc.id === txData.destinationAccountId) {
              // For transfers, amount is subtracted from origin (which means amount was negative)
              // and added to destination (so we subtract it if amount is negative, meaning Origin goes down and Destination goes up)
              return { ...acc, balance: acc.balance - txData.amount };
            }
            return acc;
          });

          return {
            transactions: [transaction, ...s.transactions],
            accounts,
          };
        });

        // Recalculate budgets automatically
        get().recalculateBudgets();

        return transaction;
      },

      updateTransaction: (id, data) => {
        const oldTx = get().transactions.find((t) => t.id === id);
        if (!oldTx) return;

        set((s) => {
          let accounts = [...s.accounts];

          // Revert old transaction amounts
          accounts = accounts.map((acc) => {
            if (acc.id === oldTx.accountId) {
              return { ...acc, balance: acc.balance - oldTx.amount };
            }
            if (oldTx.type === 'TRANSFER' && acc.id === oldTx.destinationAccountId) {
              return { ...acc, balance: acc.balance + oldTx.amount };
            }
            return acc;
          });

          // Apply new transaction amounts if they exist, else keep old
          const newAmount = data.amount !== undefined ? data.amount : oldTx.amount;
          const newAccountId = data.accountId !== undefined ? data.accountId : oldTx.accountId;
          const newDestId = data.destinationAccountId !== undefined ? data.destinationAccountId : oldTx.destinationAccountId;
          const newType = data.type !== undefined ? data.type : oldTx.type;

          accounts = accounts.map((acc) => {
            if (acc.id === newAccountId) {
              return { ...acc, balance: acc.balance + newAmount };
            }
            if (newType === 'TRANSFER' && acc.id === newDestId) {
              return { ...acc, balance: acc.balance - newAmount };
            }
            return acc;
          });

          const transactions = s.transactions.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          );

          return { transactions, accounts };
        });

        get().recalculateBudgets();
      },

      deleteTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (!tx) return;

        set((s) => {
          const accounts = s.accounts.map((acc) => {
            if (acc.id === tx.accountId) {
              return { ...acc, balance: acc.balance - tx.amount };
            }
            if (tx.type === 'TRANSFER' && acc.id === tx.destinationAccountId) {
              return { ...acc, balance: acc.balance + tx.amount };
            }
            return acc;
          });

          return {
            transactions: s.transactions.filter((t) => t.id !== id),
            accounts,
          };
        });

        get().recalculateBudgets();
      },

      // Categories
      addCategory: (catData) => {
        const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const category: Category = { ...catData, id };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },

      updateCategory: (id, data) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      // Budgets
      addBudget: (bData) => {
        const id = `bud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const budget: Budget = { ...bData, id, spent: 0 };
        set((s) => ({ budgets: [...s.budgets, budget] }));
        get().recalculateBudgets();
        return budget;
      },

      updateBudget: (id, data) => {
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...data } : b)),
        }));
        get().recalculateBudgets();
      },

      recalculateBudgets: () => {
        const { transactions, budgets } = get();
        if (budgets.length === 0) return;

        const updatedBudgets = budgets.map((b) => {
          // Find negative transactions (expenses) in this category for this month/year
          const spent = transactions
            .filter((t) => {
              if (t.categoryId !== b.categoryId || t.amount >= 0) return false;
              const tDate = new Date(t.date);
              return (
                tDate.getFullYear() === b.year &&
                tDate.getMonth() + 1 === b.month
              );
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          return { ...b, spent };
        });

        set({ budgets: updatedBudgets });
      },

      // Goals
      addGoal: (gData) => {
        const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const goal: Goal = {
          ...gData,
          id,
          currentAmount: 0,
          contributions: [],
        };
        set((s) => ({ goals: [...s.goals, goal] }));
        return goal;
      },

      updateGoal: (id, data) => {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
        }));
      },

      deleteGoal: (id) => {
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
      },

      addGoalContribution: (goalId, amount, notes) => {
        const contrId = `gcontr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        const newContribution: GoalContribution = {
          id: contrId,
          date: new Date().toISOString().split('T')[0],
          amount,
          notes,
        };

        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const contributions = [...g.contributions, newContribution];
            const currentAmount = g.currentAmount + amount;
            return { ...g, contributions, currentAmount };
          }),
        }));
      },

      // Subscriptions
      addSubscription: (sData) => {
        const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const sub: Subscription = { ...sData, id, isActive: true };
        set((s) => ({ subscriptions: [...s.subscriptions, sub] }));
        return sub;
      },

      updateSubscription: (id, data) => {
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...data } : sub)),
        }));
      },

      deleteSubscription: (id) => {
        set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) }));
      },

      // Debts
      addDebt: (dData) => {
        const id = `debt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const debt: Debt = {
          ...dData,
          id,
          payments: [],
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ debts: [...s.debts, debt] }));
        return debt;
      },

      updateDebt: (id, data) => {
        set((s) => ({
          debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)),
        }));
      },

      deleteDebt: (id) => {
        set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }));
      },

      addDebtPayment: (debtId, amount) => {
        const payId = `dpay_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        const payment: DebtPayment = {
          id: payId,
          date: new Date().toISOString().split('T')[0],
          amount,
        };

        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== debtId) return d;
            const payments = [...d.payments, payment];
            const paidSum = payments.reduce((sum, p) => sum + p.amount, 0);
            
            let status: DebtStatus = 'PENDING';
            if (paidSum >= d.amount) {
              status = 'PAID';
            } else if (paidSum > 0) {
              status = 'PARTIAL';
            }

            return { ...d, payments, status };
          }),
        }));
      },

      // Recurring
      addRecurringPayment: (rData) => {
        const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const payment: RecurringPayment = { ...rData, id };
        set((s) => ({ recurringPayments: [...s.recurringPayments, payment] }));
        return payment;
      },

      updateRecurringPayment: (id, data) => {
        set((s) => ({
          recurringPayments: s.recurringPayments.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
      },

      deleteRecurringPayment: (id) => {
        set((s) => ({ recurringPayments: s.recurringPayments.filter((p) => p.id !== id) }));
      },
    }),
    { name: 'estudi360-finances' }
  )
);
